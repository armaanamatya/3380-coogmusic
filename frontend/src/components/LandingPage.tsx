import Navbar from './Navbar'
import Hero from './Hero'
import About from './About'
import Footer from './Footer'

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <About />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage