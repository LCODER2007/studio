import Header from '@/components/layout/Header';
import SuggestionList from '@/components/suggestions/SuggestionList';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <SuggestionList />
      </main>
    </div>
  );
}
