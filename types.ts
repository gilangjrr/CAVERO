
export type FeatureKey =
  | 'text-to-image'
  | 'image-to-prompt'
  | 'image-to-image'
  | 'storyboard-director'
  | 'remove-background'
  | 'image-combiner'
  | 'change-model-style'
  | 'hashtag-planner'
  | 'promo-script-writer'
  | 'text-to-speech'
  | 'image-to-video-prompt'
  | 'text-to-video'
  | 'image-to-video';

export interface Feature {
  key: FeatureKey;
  name: string;
  icon: 'text-image' | 'combine' | 'style' | 'script' | 'hashtag' | 'voice' | 'image-prompt' | 'image-image' | 'storyboard' | 'background' | 'video-prompt' | 'video';
  implemented: boolean;
}

export type AspectRatio = '1:1' | '16:9' | '9:16';

export type PromoScript = {
  hook: string;
  problem: string;
  solution: string;
  cta: string;
  caption: string;
};

export type HashtagStrategy = {
    mainHashtags: string[];
    broadHashtags: string[];
    trendingHashtags: string[];
    audienceHashtags: string[];
};

export type StoryboardScene = {
  scene_description: string;
  visual_prompt: string;
  imageUrl?: string;
};