import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Import Firebase Firestore instance
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 1. Define the ContactMessage Interface
interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any; // Use 'any' for serverTimestamp type, or Firebase Timestamp type if imported
}

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 3. Send data to Firebase Firestore
      const newMessage: ContactMessage = {
        ...formData,
        createdAt: serverTimestamp(), // Add server-side timestamp
      };

      // Add a new document to the 'contactMessages' collection
      // Firestore will automatically create the collection if it doesn't exist
      await addDoc(collection(db, 'contactMessages'), newMessage);

      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      
      // Clear the form after successful submission
      setFormData({ name: '', email: '', subject: '', message: '' });

    } catch (error: any) {
      // 4. Add error handling
      console.error("Error sending message to Firestore:", error);
      toast({
        title: "Failed to send message",
        description: `There was an error sending your message: ${error.message}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - Zeestream</title>
        <meta name="description" content="Get in touch with the Zeestream team" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question, feedback, or suggestion? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Whether you need help with your account, have a movie request, or want to 
                report an issue, our team is here to help.
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Email Support</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Send us an email and we'll respond within 24 hours.
                      </p>
                      <p className="text-sm font-medium">support@zeestream.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Live Chat</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Chat with our AI assistant for instant help.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = '/chat'}>
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">How do I create an account?</p>
                  <p className="text-muted-foreground">Click the "Sign In" button and choose "Create account" to get started.</p>
                </div>
                <div>
                  <p className="font-medium">Can I download movies for offline viewing?</p>
                  <p className="text-muted-foreground">Yes, most movies support download functionality for offline viewing.</p>
                </div>
                <div>
                  <p className="font-medium">How do I request a movie?</p>
                  <p className="text-muted-foreground">Use the contact form or chat with our AI assistant to request new content.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full btn-stream">
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Contact;