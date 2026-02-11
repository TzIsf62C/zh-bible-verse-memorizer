import { zhuyinKeyMap, cangjieKeyMap } from './inputMaps.js';

const pinyinRows = [
	['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
	['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
	['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

const numericRows = [
	['1', '2', '3'],
	['4', '5', '6'],
	['7', '8', '9'],
	['⌫', '0', '✔']
];

const zhuyinRows = [
	['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
	['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
	['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
	['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

const cangjieRows = [
	['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
	['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
	['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

function mapDisplay(rows, map) {
	return rows.map((row) =>
		row.map((key) => ({
			key,
			display: map[key] || key
		}))
	);
}

export const keyboardLayouts = {
	pinyin: mapDisplay(pinyinRows, {}),
	zhuyin: mapDisplay(zhuyinRows, zhuyinKeyMap),
	cangjie: mapDisplay(cangjieRows, cangjieKeyMap),
	numeric: mapDisplay(numericRows, {})
};
