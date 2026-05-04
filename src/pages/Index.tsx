import IcoConverter from "@/components/IcoConverter";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <header className="mx-auto max-w-2xl text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Image to ICO Converter
          </h1>
          <p className="mt-4 text-muted-foreground">
            Drop a PNG, JPG, WEBP or GIF and download a multi-size .ico favicon. Everything runs in your browser.
          </p>
        </header>
        <IcoConverter />
      </div>
    </main>
  );
};

export default Index;
