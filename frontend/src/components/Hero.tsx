import { useNavigate } from 'react-router-dom'

const Hero = () => {
  const navigate = useNavigate()
  
  return (
    <section id="home" className="bg-gradient-to-br from-red-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Discover Your Next
            <span className="text-red-700"> Favorite Song</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            CoogMusic brings you personalized music recommendations, curated playlists, 
            and the perfect soundtrack for every moment of your life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/signup')}
              className="bg-red-700 hover:bg-red-800 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl">
              Start Listening Free
            </button>
            <button className="border border-red-700 text-red-700 hover:bg-red-50 px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
              Learn More
            </button>
          </div>
        </div>
        
        {/* Hero Image/Visual */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-8 text-white text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-4.816a1 1 0 011.617-.108zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Now Playing</h3>
              </div>
              <p className="text-red-100 text-lg">
                Your personalized music experience starts here
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
