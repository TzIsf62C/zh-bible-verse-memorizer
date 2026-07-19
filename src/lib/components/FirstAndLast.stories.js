const verses = [
	{
		id: 'story-verse-1',
		verseText: '耶穌看見大群的人，就上了山，並坐下，門徒走到祂跟前，',
		bookName: '馬太福音',
		chapterNumber: '5',
		verseNumber: '1',
		verseInitials: 'yskjdqdrjslsbzxmtzdtgq',
		bookInitials: 'MTFY',
		bibleVersion: 'CCB'
	},
	{
		id: 'story-verse-2',
		verseText: '祂便開口教導他們，說：',
		bookName: '馬太福音',
		chapterNumber: '5',
		verseNumber: '2',
		verseInitials: 'tbkkjdtms',
		bookInitials: 'MTFY',
		bibleVersion: 'CCB'
	}
];

export const InCollection = {
	props: { collection: { id: 'story-col-1', title: '登山寶訓' }, verses }
};
