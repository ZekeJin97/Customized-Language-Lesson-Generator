import { Lesson } from '@/types/lesson';

export async function generateLesson(prompt: string): Promise<Lesson> {
    const res = await fetch("http://3.147.58.5:8000/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_prompt: prompt,
            target_lang: "es",
            native_lang: "en",
        }),
    });

    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}