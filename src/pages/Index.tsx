import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormatConverter from "@/components/FormatConverter";
import BackgroundRemover from "@/components/BackgroundRemover";
import LogoMaker from "@/components/LogoMaker";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Image Toolkit
          </h1>
          <p className="mt-4 text-muted-foreground">
            Convert between formats, remove backgrounds, and create logos. Everything runs in your browser.
          </p>
        </header>

        <Tabs defaultValue="convert" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="convert">Converter</TabsTrigger>
            <TabsTrigger value="bg">BG Remover</TabsTrigger>
            <TabsTrigger value="logo">Logo Maker</TabsTrigger>
          </TabsList>
          <TabsContent value="convert" className="mt-6"><FormatConverter /></TabsContent>
          <TabsContent value="bg" className="mt-6"><BackgroundRemover /></TabsContent>
          <TabsContent value="logo" className="mt-6"><LogoMaker /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Index;
