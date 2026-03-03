import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";
import { About } from "@/components/About/About";
import { Capabilities } from "@/components/Capabilities/Capabilities";
import { Portfolio } from "@/components/Portfolio/Portfolio";
import { CaseStudies } from "@/components/CaseStudies/CaseStudies";
import { Team } from "@/components/Team/Team";
import { Contact } from "@/components/Contact/Contact";
import { Footer } from "@/components/Footer/Footer";
import { PortfolioProvider } from "@/data/portfolio";

export default function App() {
  return (
    <PortfolioProvider>
      <div className="app">
        <Header />
        <Hero />
        <About />
        <Capabilities />
        <Portfolio />
        <CaseStudies />
        <Team />
        <Contact />
        <Footer />
      </div>
    </PortfolioProvider>
  );
}
