export type TarotLesson = {
  about: string;
  question: string;
};

const LESSONS: Record<string, TarotLesson> = {
  'the fool': {
    about: 'A beginning. You step forward before every detail is known.',
    question: 'What would you try if you did not need a perfect plan?',
  },
  'the magician': {
    about: 'Skill and focus. The tools you already have can start the work.',
    question: 'Which skill have you been waiting to use?',
  },
  'the high priestess': {
    about: 'Quiet knowledge. The answer is not loud yet.',
    question: 'What do you already sense, before you explain it?',
  },
  'the empress': {
    about: 'Care and growth. Something needs time and attention to flourish.',
    question: 'What in your life needs tending rather than forcing?',
  },
  'the emperor': {
    about: 'Structure. Clear limits make the next step safer.',
    question: 'Where would a simple rule help you?',
  },
  'the hierophant': {
    about: 'Teaching and tradition. A guide or a practice can steady you.',
    question: 'Whose experience would you trust with this question?',
  },
  'the lovers': {
    about: 'A choice of the heart. Alignment matters more than a quick yes.',
    question: 'What are you actually choosing between?',
  },
  'the chariot': {
    about: 'Direction. Pull competing urges into one path.',
    question: 'What is the one direction you will hold this week?',
  },
  strength: {
    about: 'Steady courage. Force is softer than it looks.',
    question: 'Where can patience do what pressure cannot?',
  },
  'the hermit': {
    about: 'A pause for your own light. Solitude is part of the answer.',
    question: 'What becomes clearer when you step back?',
  },
  'wheel of fortune': {
    about: 'A turn. This moment is moving, even if you did not start it.',
    question: 'What can you accept is changing?',
  },
  justice: {
    about: 'Cause and consequence. Fairness asks for an honest look.',
    question: 'What fact have you been leaving out?',
  },
  'the hanged man': {
    about: 'A different angle. Waiting can be the useful move.',
    question: 'What shifts if you stop pushing for a day?',
  },
  death: {
    about: 'An ending that makes room. It is a change of form, not a threat.',
    question: 'What are you ready to let finish?',
  },
  temperance: {
    about: 'Mixing in the right measure. Balance is a practice, not a mood.',
    question: 'What two needs can share the same day?',
  },
  'the devil': {
    about: 'A bind you can see. Naming the habit loosens it.',
    question: 'What loop do you keep calling necessary?',
  },
  'the tower': {
    about: 'A sudden truth. What was unstable is showing itself.',
    question: 'What can you rebuild more honestly after this?',
  },
  'the star': {
    about: 'Hope after strain. A small light is enough to continue.',
    question: 'What is one gentle next step?',
  },
  'the moon': {
    about: 'Uncertainty. Not every fear is a fact.',
    question: 'What can you check before you believe the worry?',
  },
  'the sun': {
    about: 'Clarity and warmth. Something can be enjoyed in the open.',
    question: 'What good thing have you been hiding?',
  },
  judgement: {
    about: 'A call to respond. The past is asking for a decision.',
    question: 'What are you ready to answer?',
  },
  'the world': {
    about: 'A cycle completing. You can close this chapter and keep what you learned.',
    question: 'What is actually finished?',
  },
};

export function tarotLesson(cardName: string): TarotLesson {
  const known = LESSONS[cardName.trim().toLowerCase()];
  if (known) return known;
  return {
    about: 'This card is a picture for your question, not a fixed prediction.',
    question: 'What part of the picture fits what you are living now?',
  };
}

export function tarotGuideLabel(cardName: string): string {
  const name = cardName.trim() || 'this card';
  return `Ask a pandit about ${name}`;
}
