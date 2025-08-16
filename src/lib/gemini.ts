import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { Movie } from '@/types/movie';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

interface AiResponse {
  text: string;
  movies?: Movie[];
  aiAction?: 'search_movies' | 'general_chat' | 'identity_response';
}

const SYSTEM_INSTRUCTION = `
You are Zee AI, the helpful movie assistant for Zeestream, developed by Rwandascratch. Your goal is to assist users with Zeestream-related questions or find movies based on their input.

Capabilities:
1. **Identity/Greeting**: For queries like "who are you", "what is Zeestream", or greetings ("hi"), respond naturally about Zeestream. Example: "Hi [userName]! I'm Zee AI, your Zeestream movie assistant. Ask about our platform or movies!"
2. **Movie Search**: For movie queries (e.g., "action movies", "comedy from 2020", "movies with high rating", "series about adventure", "horror movies", "romance films"), analyze the provided movie JSON and return:
   - A friendly, conversational message explaining what you found
   - A JSON array of matching movie IDs in this exact format: {"movieIds": ["id1", "id2", "id3"]}
   
   Search criteria can include:
   - Genre/Category (action, comedy, horror, romance, drama, etc.)
   - Rating (high rated = rating >= 7, good = rating >= 5)
   - Type (series = isSeries: true, movies = isSeries: false)
   - Upload date (recent = newer uploadDate, old = older uploadDate)
   - Coming soon status (comingSoon: true)
   - Specific movie names or partial matches
   - Description keywords
   
   If no exact matches found, suggest 5-10 popular movies (rating >= 6) as alternatives.
   
3. **General Conversation**: For non-movie Zeestream queries (e.g., "how does Zeestream work"), respond naturally without movieIds. Ask follow-up questions if input is vague.

IMPORTANT: Always respond with a friendly message. For movie searches, include {"movieIds": ["id1", "id2"]} in your response.

Movie JSON:
{movieDataForAI}
`;

export const generateChatResponse = async (
  userMessage: string,
  movieContext: Movie[], // Not used directly since we fetch all movies
  chatSession: ChatSession,
  userName?: string
): Promise<AiResponse> => {
  let aiText = '';
  let moviesToSuggest: Movie[] | undefined = undefined;
  let aiAction: AiResponse['aiAction'] = 'general_chat';

  // Fetch all movies from Firebase
  const moviesRef = collection(db, 'movies');
  const querySnapshot = await getDocs(query(moviesRef));
  const allMovies: Movie[] = [];
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.releaseDate instanceof Timestamp) {
      data.releaseDate = data.releaseDate.toDate();
    }
    if (data.uploadDate instanceof Timestamp) {
      data.uploadDate = data.uploadDate.toDate();
    }
    allMovies.push({ id: doc.id, ...data } as Movie);
  });

  // Convert movies to JSON for Gemini with all necessary details
  const movieDataForAI = JSON.stringify(
    allMovies.map(movie => ({
      id: movie.id,
      name: movie.name,
      slug: movie.slug,
      thumbnailUrl: movie.thumbnailUrl,
      type: movie.type,
      category: movie.category,
      likes: movie.likes.length,
      commentsCount: movie.comments.length,
      rating: movie.rating,
      uploadDate: movie.uploadDate.toISOString(),
      description: movie.description,
      trailerUrl: movie.trailerUrl,
      isSeries: movie.isSeries,
      relationship: movie.relationship,
      comingSoon: movie.comingSoon,
      releaseDate: movie.releaseDate ? movie.releaseDate.toISOString() : undefined,
      translator: movie.translator,
      watchUrl: movie.watchUrl,
      downloadUrl: movie.downloadUrl,
    })),
    null,
    2
  );

  const fullPrompt = `${SYSTEM_INSTRUCTION.replace('{movieDataForAI}', movieDataForAI)}
User question: ${userMessage}
Use [userName] for ${userName || 'user'}.`;

  try {
    const result = await chatSession.sendMessage(fullPrompt);
    const response = await result.response;
    const geminiRawText = response.text();

    // Log raw response for debugging
    console.log('Gemini raw response:', geminiRawText);

    // Extract the main text (everything before any JSON)
    const jsonMatch = geminiRawText.match(/\{"movieIds":\s*\[.*?\]\}/);
    if (jsonMatch) {
      // Movie search response
      aiAction = 'search_movies';
      aiText = geminiRawText.replace(jsonMatch[0], '').trim();
      
      try {
        const movieData = JSON.parse(jsonMatch[0]);
        const movieIds = movieData.movieIds || [];
        
        // Get movies by IDs
        moviesToSuggest = allMovies.filter(movie => movieIds.includes(movie.id));
        
        // If no movies found by ID, provide suggestions
        if (moviesToSuggest.length === 0) {
          aiText = "I couldn't find exact matches, but here are some popular movies you might enjoy:";
          moviesToSuggest = allMovies
            .filter(movie => movie.rating >= 6)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 10);
        }
      } catch (error) {
        console.error('Error parsing movie IDs:', error);
        aiText = "Sorry, I couldn't process that movie request. Try asking for specific genres or titles!";
        aiAction = 'general_chat';
      }
    } else {
      // General conversation response
      aiText = geminiRawText.replace('[userName]', userName || 'there');
      aiAction = 'general_chat';

      // Check if it's an identity response
      const lowerCaseAiText = aiText.toLowerCase();
      if (lowerCaseAiText.includes('zee ai') || lowerCaseAiText.includes('zeestream')) {
        aiAction = 'identity_response';
      }
    }

    if (!aiText) {
      aiText = "Sorry, I couldn't process that. Try asking about Zeestream or movies!";
    }
  } catch (error) {
    console.error('Error with Gemini:', error);
    aiText = "Sorry, I'm having trouble. Try again later.";
  }

  // Log final response for debugging
  console.log('Final AI response:', { text: aiText, movies: moviesToSuggest, aiAction });

  return { text: aiText, movies: moviesToSuggest, aiAction };
};