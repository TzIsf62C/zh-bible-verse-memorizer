import { describe, expect, it } from 'vitest';
import { translations } from '$lib/i18n/translations.js';

const requiredSecondChanceKeys = [
  'second_chance_review_title',
  'second_chance_review_info',
  'second_chance_review_summary',
  'second_chance_minimum_score_label',
  'second_chance_minimum_score_help',
  'second_chance_recovery_percent_label',
  'second_chance_recovery_info_aria',
  'second_chance_recovery_info_title',
  'second_chance_recovery_info_body',
  'enable_second_chance_indicator_in_reviews',
  'second_chance_indicator_info_aria',
  'second_chance_indicator_info_title',
  'second_chance_indicator_info_body',
  'second_chance_due_now',
  'second_chance_in_hour',
  'second_chance_in_hours',
  'second_chance_in_minutes',
  'second_chance_preview_text',
  'second_chance_preview_reference'
];

describe('i18n translations', () => {
  it('includes the second chance review strings for every supported language', () => {
    Object.keys(translations).forEach((locale) => {
      requiredSecondChanceKeys.forEach((key) => {
        expect(translations[locale][key], `${locale}.${key}`).toBeTypeOf('string');
      });
    });
  });
});
