import { Hero } from "./components/hero";
import { Story } from "./components/story";
import { HowItWorks } from "./components/how-it-works";
import { Voices } from "./components/voices";
import { Preorder } from "./components/preorder";
import { Faq } from "./components/faq";

export default function Home() {
  return (
    <main>
      <Hero />
      <Story />
      <HowItWorks />
      <Voices />
      <Preorder />
      <Faq />
    </main>
  );
}