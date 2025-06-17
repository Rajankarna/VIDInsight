import React from 'react';
import Navbar from '@/components/Navbar';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

const Team: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Bishal Babu Rajbanshi',
      role: 'Team Leader',
      image: '/team/team1.png',
      bio: 'Final-year B.Tech student in Computer Science, specializing in AI and Machine Learning at M.S. Ramaiah Institute of Technology, Bangalore. Passionate about creating innovative tech solutions, with a strong focus on applying AI to solve real-world challenges.',
    },
    {
      name: 'Kaushik Raj Ghimire',
      role: 'Software Development Engineer',
      image: '/team/team4.jpeg',
      bio: 'Kaushik helps in building robust AI-driven applications, with expertise in developing innovative solutions for video analysis and natural language processing, dedicated to creating impactful software for real-world challenges.',
    },
    {
      name: 'Rajan Lal Karna',
      role: 'Lead AI Researcher',
      image: '/team/team3.jpeg',
      bio: 'Rajan leads our research efforts, developing new algorithms for video analysis and natural language understanding.',
    },
    {
      name: 'Priyanshu Mishra',
      role: 'UX/UI Designer',
      image: '/team/team2.jpeg',
      bio: 'Priyanshu ensures that our platform is intuitive and accessible, creating seamless user experiences across all devices.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Meet Our Team
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                The passionate minds behind VidInsight, dedicated to transforming video content through AI.
              </p>
            </div>
          </div>
        </section>
        
        {/* Team members section */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member) => (
                <div key={member.name} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-70 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src={member.image}
                      alt={member.name}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-brand-600 mb-3">{member.role}</p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Values section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
                The principles that guide everything we do
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We constantly push the boundaries of what's possible with AI and video analysis.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Accessibility</h3>
                <p className="text-gray-600">
                  We believe in making advanced technology accessible and useful for everyone.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Excellence</h3>
                <p className="text-gray-600">
                  We strive for excellence in everything we do, from code to customer service.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">User-Focused</h3>
                <p className="text-gray-600">
                  Our users are at the center of every decision we make and feature we build.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Join us section */}
        <section className="py-16 bg-brand-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Team</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              We're always looking for talented individuals who are passionate about AI, video processing, and creating amazing user experiences.
            </p>
            <a 
              href="/contact" 
              className="inline-block bg-white text-brand-700 px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition"
            >
              Get in Touch
            </a>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 VidInsight. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Team;