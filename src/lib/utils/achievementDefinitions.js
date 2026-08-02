export const COUNT_SERIES = {
	verses_learned: {
		id: 'verses_learned',
		category: 'count',
		metric: 'learnedVerseCount',
		levels: [
			{ id: 'good_soil', threshold: 1, titleKey: 'achievement_good_soil' },
			{ id: 'planted_seed', threshold: 5, titleKey: 'achievement_planted_seed' },
			{ id: 'emerging_sprout', threshold: 10, titleKey: 'achievement_emerging_sprout' },
			{ id: 'seedling', threshold: 20, titleKey: 'achievement_seedling' },
			{ id: 'sapling', threshold: 50, titleKey: 'achievement_sapling' },
			{ id: 'young_tree', threshold: 100, titleKey: 'achievement_young_tree' },
			{ id: 'flowering_tree', threshold: 250, titleKey: 'achievement_flowering_tree' },
			{ id: 'fruitful_tree', threshold: 500, titleKey: 'achievement_fruitful_tree' }
		]
	},
	verses_mastered: {
		id: 'verses_mastered',
		category: 'count',
		metric: 'masteredVerseCount',
		levels: [
			{ id: 'mustard_seed', threshold: 1, titleKey: 'achievement_mustard_seed' },
			{ id: 'juniper_tree', threshold: 5, titleKey: 'achievement_juniper_tree' },
			{ id: 'sycamore_fig', threshold: 10, titleKey: 'achievement_sycamore_fig' },
			{ id: 'palm_of_deborah', threshold: 20, titleKey: 'achievement_palm_of_deborah' },
			{ id: 'oak_of_moreh', threshold: 50, titleKey: 'achievement_oak_of_moreh' },
			{ id: 'olive_tree', threshold: 100, titleKey: 'achievement_olive_tree' },
			{ id: 'cedar_of_lebanon', threshold: 250, titleKey: 'achievement_cedar_of_lebanon' },
			{ id: 'tree_of_life', threshold: 500, titleKey: 'achievement_tree_of_life' }
		]
	},
	chapters_learned: {
		id: 'chapters_learned',
		category: 'count',
		metric: 'learnedChapterCount',
		levels: [
			{ id: 'waters_edge', threshold: 1, titleKey: 'achievement_waters_edge' },
			{ id: 'ankle_deep', threshold: 5, titleKey: 'achievement_ankle_deep' },
			{ id: 'knee_deep', threshold: 10, titleKey: 'achievement_knee_deep' },
			{ id: 'waist_deep', threshold: 15, titleKey: 'achievement_waist_deep' },
			{ id: 'deep_waters', threshold: 20, titleKey: 'achievement_deep_waters' }
		]
	},
	chapters_mastered: {
		id: 'chapters_mastered',
		category: 'count',
		metric: 'masteredChapterCount',
		levels: [
			{ id: 'dew_of_hermon', threshold: 1, titleKey: 'achievement_dew_of_hermon' },
			{ id: 'hagars_spring', threshold: 5, titleKey: 'achievement_hagars_spring' },
			{ id: 'jacobs_well', threshold: 10, titleKey: 'achievement_jacobs_well' },
			{ id: 'pool_of_siloam', threshold: 15, titleKey: 'achievement_pool_of_siloam' },
			{ id: 'river_of_life', threshold: 20, titleKey: 'achievement_river_of_life' }
		]
	},
	psalms_learned: {
		id: 'psalms_learned',
		category: 'count',
		metric: 'learnedPsalmsCount',
		levels: [
			{ id: 'director_of_music', threshold: 1, titleKey: 'achievement_director_of_music' },
			{ id: 'song_of_ascent', threshold: 5, titleKey: 'achievement_song_of_ascent' },
			{ id: 'sons_of_korah', threshold: 10, titleKey: 'achievement_sons_of_korah' },
			{ id: 'tune_of_lilies', threshold: 15, titleKey: 'achievement_tune_of_lilies' },
			{ id: 'selah', threshold: 20, titleKey: 'achievement_selah' }
		]
	},
	psalms_mastered: {
		id: 'psalms_mastered',
		category: 'count',
		metric: 'masteredPsalmsCount',
		levels: [
			{ id: 'sound_of_horn', threshold: 1, titleKey: 'achievement_sound_of_horn' },
			{ id: 'harp_lyre', threshold: 5, titleKey: 'achievement_harp_lyre' },
			{ id: 'tambourine_dancing', threshold: 10, titleKey: 'achievement_tambourine_dancing' },
			{ id: 'strings_flute', threshold: 15, titleKey: 'achievement_strings_flute' },
			{ id: 'resounding_cymbals', threshold: 20, titleKey: 'achievement_resounding_cymbals' }
		]
	},
	streak_days: {
		id: 'streak_days',
		category: 'streak',
		metric: 'streakDays',
		levels: [
			{ id: 'fruit_of_love', threshold: 5, titleKey: 'achievement_fruit_of_love' },
			{ id: 'fruit_of_joy', threshold: 10, titleKey: 'achievement_fruit_of_joy' },
			{ id: 'fruit_of_peace', threshold: 20, titleKey: 'achievement_fruit_of_peace' },
			{ id: 'fruit_of_patience', threshold: 45, titleKey: 'achievement_fruit_of_patience' },
			{ id: 'fruit_of_kindness', threshold: 90, titleKey: 'achievement_fruit_of_kindness' },
			{ id: 'fruit_of_goodness', threshold: 180, titleKey: 'achievement_fruit_of_goodness' },
			{ id: 'fruit_of_faithfulness', threshold: 270, titleKey: 'achievement_fruit_of_faithfulness' },
			{ id: 'fruit_of_gentleness', threshold: 365, titleKey: 'achievement_fruit_of_gentleness' },
			{ id: 'fruit_of_self_control', threshold: 730, titleKey: 'achievement_fruit_of_self_control' },
			{ id: 'fruit_of_spirit', threshold: 1095, titleKey: 'achievement_fruit_of_spirit' }
		]
	}
};

export const BOOK_SERIES_TYPE = 'book';
export const PASSAGE_SERIES_TYPE = 'passage';
