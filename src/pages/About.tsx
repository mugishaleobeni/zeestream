import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Play, Users, Globe, Zap, ExternalLink } from 'lucide-react';

// --- Developer Data (You can move this to a separate data file if preferred) ---
const developers = [
  {
    name: 'Theo Dev Rwanda',
    role: 'Full-stack Developer',
    skills: 'React, Node.js, Firebase, Tailwind CSS, UI/UX',
    photo: 'https://res.cloudinary.com/ddjprb8uw/image/upload/v1752665622/0J5A1305_3_ykkd9u.jpg', // Replace with Theo's actual photo URL
    portfolioLink: 'https://www.theomuremyi.com', // Replace with Theo's actual portfolio link
  },
  {
    name: 'Leobeni Mugisha',
    role: 'Frontend Engineer',
    skills: 'React, TypeScript, CSS-in-JS, Responsive Design',
    photo: 'https://res.cloudinary.com/ddjprb8uw/image/upload/v1752740275/WhatsApp_Image_2025-07-17_at_10.11.24_qmlphu.jpg', // Example image
    portfolioLink: 'https://janesmith.dev', // Replace with Jane's actual portfolio link
  },
  {
    name: 'Samauel Kleber Nishimwe',
    role: 'Backend Developer',
    skills: 'Python, Django, PostgreSQL, Cloud Deployments',
    photo: 'https://res.cloudinary.com/ddjprb8uw/image/upload/v1752740362/WhatsApp_Image_2025-07-17_at_10.14.41_tesdgm.jpg', // Example image
    portfolioLink: 'https://robertbrown.net', // Replace with Robert's actual portfolio link
  },
];
// --- End Developer Data ---

const About = () => {
  const pageTitle = "About Us - Zeestream";
  const pageDescription = "Learn about Zeestream - your ultimate movie streaming destination. Discover our mission, features, and the team behind the platform.";
  const pageUrl = window.location.href;
  const pageImage = "https://placehold.co/1200x630/E0E0E0/333333?text=Zeestream+About"; // Specific image for About page

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* Open Graph Tags for Social Media */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:site_name" content="Zeestream" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />

        {/* Canonical Link */}
        <link rel="canonical" href={pageUrl} />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-gradient">Zeestream</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're passionate about bringing you the best movie streaming experience with 
            cutting-edge technology and an extensive library of content.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">High Quality Streaming</h3>
            <p className="text-muted-foreground text-sm">
              Enjoy movies in HD and 4K quality with seamless streaming experience.
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
            <p className="text-muted-foreground text-sm">
              Connect with fellow movie enthusiasts through comments and ratings.
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Global Content</h3>
            <p className="text-muted-foreground text-sm">
              Discover movies from around the world with original and dubbed versions.
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
            <p className="text-muted-foreground text-sm">
              Get personalized movie recommendations with our AI-powered chat assistant.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Zeestream was born from a simple idea: everyone deserves access to great movies. 
                We started as a small team of movie enthusiasts who wanted to create a platform 
                that combines the latest technology with a vast library of content.
              </p>
              <p>
                Today, we're proud to offer a streaming experience that includes everything from 
                blockbuster hits to indie gems, with both original and translated versions to 
                serve our global audience.
              </p>
              <p>
                Our AI-powered recommendation system learns from your preferences to suggest 
                movies you'll love, making movie discovery effortless and exciting.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video bg-gradient-card rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-10 h-10 text-white" />
                </div>
                <p className="text-muted-foreground">Bringing movies to life</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-card rounded-xl p-8 text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            To democratize entertainment by providing universal access to quality movies, 
            fostering a global community of film lovers, and using technology to enhance 
            the way people discover and enjoy cinema.
          </p>
        </div>

        {/* --- Meet Our Developers Section --- */}
        <div className="py-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Meet Our <span className="text-gradient">Developers</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {developers.map((dev, index) => (
              <div
                key={index}
                className="relative bg-card rounded-xl overflow-hidden
                           [box-shadow:0_25px_50px_-12px_rgba(0,0,0,0.7)] /* Custom dark shadow only at bottom */
                           transform transition-transform duration-300 hover:scale-105
                           hover:[box-shadow:0_35px_70px_-17px_rgba(0,0,0,0.8)]" /* Enhanced shadow on hover */
              >
                {/* Developer Photo */}
                <img
                  src={dev.photo}
                  alt={dev.name}
                  className="w-full h-80 object-cover" // Fixed height for consistency, object-cover to fill
                />

                {/* Overlay with Name, Role, Skills, and Portfolio Link (Always visible) */}
                <div
                  className="absolute inset-0 bg-black/70 /* Solid semi-transparent background */
                             flex flex-col justify-end p-6 text-white"
                >
                  <h3 className="text-xl font-bold mb-2">{dev.name}</h3>
                  <p className="text-primary-foreground text-sm font-semibold">{dev.role}</p>
                  <p className="text-xs text-gray-300 mb-4">{dev.skills}</p>
                  <a
                    href={dev.portfolioLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-primary text-primary-foreground 
                                px-4 py-2 rounded-md font-medium text-sm
                                hover:bg-primary/90 transition-colors duration-200"
                  >
                    Portfolio <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* --- End Meet Our Developers Section --- */}
      </div>
    </>
  );
};

export default About;
