
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { submitContactForm } from '@/utils/api';
import { toast } from 'sonner';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitContactForm(name, email, message);
      toast.success('Your message has been sent successfully!');
      // Clear form
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12">
        {/* Hero section */}
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Contact Us
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                Have questions or feedback? We're here to help!
              </p>
            </div>
          </div>
        </section>
        
        {/* Contact form section */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <Card className="p-6 bg-white shadow-md">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>
                  <p className="text-gray-600">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      className="min-h-[120px]"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>Send Message</>
                    )}
                  </Button>
                </form>
              </Card>
              
              <div>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900">support@vidinsight.com</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Headquarters</p>
                      <p className="text-gray-900">123 AI Boulevard</p>
                      <p className="text-gray-900">San Francisco, CA 94105</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Office Hours</p>
                      <p className="text-gray-900">Monday - Friday: 9am - 5pm PST</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-brand-700">
                        What file formats do you support?
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        We support most common video formats including MP4, MOV, AVI, and more. You can also analyze YouTube videos directly by pasting the URL.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-brand-700">
                        Is there a limit to video length?
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        The free tier supports videos up to 10 minutes in length. Premium plans allow for longer videos.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-brand-700">
                        How accurate is the transcription?
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        Our transcription has an accuracy rate of over 95% for clear audio in English. We're continuously improving support for other languages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; 2025 VidInsight. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
