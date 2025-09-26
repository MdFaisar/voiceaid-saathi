import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Edit2, Trash2, Play, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface QuickPhrasesProps {
  onBack: () => void;
}

interface Phrase {
  id: string;
  text: string;
  category: "emergency" | "daily" | "custom";
  isDefault?: boolean;
}

const defaultPhrases: Phrase[] = [
  { id: "1", text: "I need help", category: "emergency", isDefault: true },
  { id: "2", text: "I am bleeding", category: "emergency", isDefault: true },
  { id: "3", text: "Call 911", category: "emergency", isDefault: true },
  { id: "4", text: "I can't breathe", category: "emergency", isDefault: true },
  { id: "5", text: "I am in pain", category: "emergency", isDefault: true },
  { id: "6", text: "Thank you", category: "daily", isDefault: true },
  { id: "7", text: "I am thirsty", category: "daily", isDefault: true },
  { id: "8", text: "I am hungry", category: "daily", isDefault: true },
];

export const QuickPhrases = ({ onBack }: QuickPhrasesProps) => {
  const [phrases, setPhrases] = useState<Phrase[]>(defaultPhrases);
  const [newPhrase, setNewPhrase] = useState("");
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [activePhrase, setActivePhrase] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Load phrases from localStorage
    const savedPhrases = localStorage.getItem('quickPhrases');
    if (savedPhrases) {
      try {
        const parsed = JSON.parse(savedPhrases);
        setPhrases([...defaultPhrases, ...parsed]);
      } catch (error) {
        console.error('Error loading saved phrases:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save custom phrases to localStorage
    const customPhrases = phrases.filter(p => !p.isDefault);
    localStorage.setItem('quickPhrases', JSON.stringify(customPhrases));
  }, [phrases]);

  const addPhrase = () => {
    if (!newPhrase.trim()) return;
    
    const phrase: Phrase = {
      id: Date.now().toString(),
      text: newPhrase.trim(),
      category: "custom"
    };
    
    setPhrases([...phrases, phrase]);
    setNewPhrase("");
    setIsDialogOpen(false);
    
    toast({
      title: "Phrase added",
      description: "Your custom phrase has been saved",
    });
  };

  const editPhrase = () => {
    if (!editingPhrase || !editingPhrase.text.trim()) return;
    
    setPhrases(phrases.map(p => 
      p.id === editingPhrase.id ? editingPhrase : p
    ));
    
    setEditingPhrase(null);
    setEditDialogOpen(false);
    
    toast({
      title: "Phrase updated",
      description: "Your phrase has been updated",
    });
  };

  const deletePhrase = (phraseId: string) => {
    const phrase = phrases.find(p => p.id === phraseId);
    if (phrase?.isDefault) {
      toast({
        title: "Cannot delete",
        description: "Default phrases cannot be deleted",
        variant: "destructive"
      });
      return;
    }
    
    setPhrases(phrases.filter(p => p.id !== phraseId));
    
    toast({
      title: "Phrase deleted",
      description: "The phrase has been removed",
    });
  };

  const speakPhrase = (text: string, phraseId: string) => {
    if (activePhrase === phraseId) {
      stopSpeaking();
      return;
    }

    // Stop any existing speech
    stopSpeaking();
    
    setActivePhrase(phraseId);
    
    const speak = () => {
      if ('speechSynthesis' in window) {
        speechRef.current = new SpeechSynthesisUtterance(text);
        speechRef.current.rate = 0.8;
        speechRef.current.volume = 1;
        speechRef.current.pitch = 1;
        
        speechRef.current.onend = () => {
          // Continue speaking if still active
          if (activePhrase === phraseId) {
            setTimeout(speak, 1000); // 1 second pause between repeats
          }
        };
        
        speechRef.current.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          stopSpeaking();
        };
        
        speechSynthesis.speak(speechRef.current);
      } else {
        toast({
          title: "Not supported",
          description: "Speech synthesis is not supported in your browser",
          variant: "destructive"
        });
      }
    };
    
    speak();
    
    toast({
      title: "Speaking phrase",
      description: `Repeating: "${text}"`,
    });
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setActivePhrase(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "emergency": return "bg-destructive";
      case "daily": return "bg-primary";
      case "custom": return "bg-secondary";
      default: return "bg-muted";
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "emergency": return "Emergency";
      case "daily": return "Daily";
      case "custom": return "Custom";
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Phrase</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Quick Phrase</DialogTitle>
                <DialogDescription>
                  Create a custom phrase that you can speak aloud repeatedly
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your phrase..."
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addPhrase} disabled={!newPhrase.trim()}>
                    Add Phrase
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Speaking Alert */}
        {activePhrase && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="font-medium">Currently Speaking</p>
                  <p className="text-sm text-muted-foreground">
                    {phrases.find(p => p.id === activePhrase)?.text}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={stopSpeaking}
                size="sm"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span>Quick Phrases</span>
            </CardTitle>
            <CardDescription>
              Click any phrase to have it spoken aloud repeatedly. Perfect for emergencies when you cannot speak.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Emergency Phrases */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-destructive">Emergency Phrases</CardTitle>
            <CardDescription>Critical phrases for emergency situations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {phrases.filter(p => p.category === "emergency").map((phrase) => (
                <div
                  key={phrase.id}
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    activePhrase === phrase.id 
                      ? 'border-primary bg-primary/10 shadow-md' 
                      : 'hover:border-primary/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1" onClick={() => speakPhrase(phrase.text, phrase.id)}>
                      <p className="font-medium text-lg">{phrase.text}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getCategoryColor(phrase.category)}>
                          {getCategoryText(phrase.category)}
                        </Badge>
                        {activePhrase === phrase.id && (
                          <Badge variant="outline" className="animate-pulse">
                            Speaking...
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={activePhrase === phrase.id ? "destructive" : "default"}
                        size="sm"
                        onClick={() => speakPhrase(phrase.text, phrase.id)}
                      >
                        {activePhrase === phrase.id ? (
                          <Square className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      {!phrase.isDefault && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPhrase(phrase);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePhrase(phrase.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily & Custom Phrases */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Phrases</CardTitle>
              <CardDescription>Common everyday expressions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {phrases.filter(p => p.category === "daily").map((phrase) => (
                  <div
                    key={phrase.id}
                    className={`p-3 border rounded-lg transition-all duration-200 ${
                      activePhrase === phrase.id 
                        ? 'border-primary bg-primary/10' 
                        : 'hover:border-primary/50 cursor-pointer'
                    }`}
                    onClick={() => speakPhrase(phrase.text, phrase.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{phrase.text}</p>
                        {activePhrase === phrase.id && (
                          <Badge variant="outline" className="animate-pulse text-xs mt-1">
                            Speaking...
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant={activePhrase === phrase.id ? "destructive" : "ghost"}
                        size="sm"
                      >
                        {activePhrase === phrase.id ? (
                          <Square className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Phrases</CardTitle>
              <CardDescription>Your personalized phrases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {phrases.filter(p => p.category === "custom").length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No custom phrases yet. Add one using the button above.
                  </p>
                ) : (
                  phrases.filter(p => p.category === "custom").map((phrase) => (
                    <div
                      key={phrase.id}
                      className={`p-3 border rounded-lg transition-all duration-200 ${
                        activePhrase === phrase.id 
                          ? 'border-primary bg-primary/10' 
                          : 'hover:border-primary/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1" onClick={() => speakPhrase(phrase.text, phrase.id)}>
                          <p className="font-medium">{phrase.text}</p>
                          {activePhrase === phrase.id && (
                            <Badge variant="outline" className="animate-pulse text-xs mt-1">
                              Speaking...
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant={activePhrase === phrase.id ? "destructive" : "ghost"}
                            size="sm"
                            onClick={() => speakPhrase(phrase.text, phrase.id)}
                          >
                            {activePhrase === phrase.id ? (
                              <Square className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPhrase(phrase);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePhrase(phrase.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Phrase</DialogTitle>
              <DialogDescription>
                Modify your phrase
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your phrase..."
                value={editingPhrase?.text || ""}
                onChange={(e) => setEditingPhrase(prev => prev ? { ...prev, text: e.target.value } : null)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editPhrase} disabled={!editingPhrase?.text.trim()}>
                  Update Phrase
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};