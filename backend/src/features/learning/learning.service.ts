import { createAdminSupabase } from '../../config/supabase';
import type { LearningQuestion } from '../../shared/types/database.types';

class LearningService {
  async getRandomActiveQuestion(): Promise<LearningQuestion | null> {
    const supabase = createAdminSupabase();
    // Supabase doesn't provide a simple RNG order-by in all cases,
    // so we fetch a small set and pick randomly.
    const { data, error } = await supabase
      .from('learning_questions')
      .select('*')
      .eq('is_active', true)
      .limit(10);

    if (error) throw new Error(`Failed to fetch learning question: ${error.message}`);
    if (!data || data.length === 0) return null;

    const pick = data[Math.floor(Math.random() * data.length)];
    return pick as LearningQuestion;
  }
}

export const learningService = new LearningService();

