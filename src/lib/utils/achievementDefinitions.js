export const achievementDefinitions = [
	{
		id: 'learned_10_verses',
		titleKey: 'achievement_learned_10_verses',
		descriptionKey: 'achievement_learned_10_verses_desc',
		condition: (summary) => summary.learnedVerseCount >= 10
	},
	{
		id: 'mastered_10_verses',
		titleKey: 'achievement_mastered_10_verses',
		descriptionKey: 'achievement_mastered_10_verses_desc',
		condition: (summary) => summary.masteredVerseCount >= 10
	},
	{
		id: 'learned_1_chapter',
		titleKey: 'achievement_learned_1_chapter',
		descriptionKey: 'achievement_learned_1_chapter_desc',
		condition: (summary) => summary.learnedChapterCount >= 1
	},
	{
		id: 'mastered_1_chapter',
		titleKey: 'achievement_mastered_1_chapter',
		descriptionKey: 'achievement_mastered_1_chapter_desc',
		condition: (summary) => summary.masteredChapterCount >= 1
	},
	{
		id: 'learned_sermon_on_mount',
		titleKey: 'achievement_learned_sermon_on_mount',
		descriptionKey: 'achievement_learned_sermon_on_mount_desc',
		condition: (summary) => summary.ranges.sermon_on_mount?.learned === true
	},
	{
		id: 'mastered_sermon_on_mount',
		titleKey: 'achievement_mastered_sermon_on_mount',
		descriptionKey: 'achievement_mastered_sermon_on_mount_desc',
		condition: (summary) => summary.ranges.sermon_on_mount?.mastered === true
	}
];
