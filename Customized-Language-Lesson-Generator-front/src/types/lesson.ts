export interface VocabItem {
    native: string;
    target: string;
}

export interface TranslationItem {
    native: string;
    target: string;
}

export interface Quiz {
    vocab_matching: VocabItem[];
    mini_translations: TranslationItem[];
}

export interface Lesson {
    vocabulary: VocabItem[];
    grammar_notes: string;
    quiz: Quiz;
}

export type CurrentStep = "input" | "lesson" | "vocab_quiz" | "fillblank_quiz" | "reverse_quiz";