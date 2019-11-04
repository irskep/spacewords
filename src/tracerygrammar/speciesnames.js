// with apologies to https://www.springhole.net/writing_roleplaying_randomators/greekyish-names.htm
import tracery from 'tracery-grammar';

/*
GURPS Aliens
An Phar
Banduch
Cidi
Crystal Computer
Engai
Fasanni
Garuda
Gerodian
Gloworm
Gormelite
Irari
Jaril
Kaa
Kinsi
Kronin
Liook Sujan
Malikithi
Markann
Memer and Saret
Mmm
Nexa
Pachekki
Purulu
Riders
Sparrials
Tamile
Traders
Treefolk
Truul
Verms
Xenomorph
Xrex
Yalkani
Winterfolk
*/

const grammar = tracery.createGrammar({
	'root': [
		'#simple#',
	],

	'simple': [
		// "#firstconsonant##ending#",
		"#firstconsonant##maybesecondconsonant##ending#",
		"#firstconsonant##maybesecondconsonant##vowel##midletters##ending#",
		"#firstvowel##midletters##ending#",
		"#firstvowel##midletters##vowel##midletters##ending#",
	],

	'firstvowel': [
		"A",
		"Ae",
		"Ai",
		"E",
		"Eio",
		"Eu",
		"I",
		"Ia",
		"O",
		"Ou",
		"U",
		"Uo",
		"Oo",
		"Ee",
		"Aa",
		"Uu",
		"Ii",
		"Ui",
	],

	'firstconsonant': [
		"B",
		"C",
		"D",
		"F",
		"G",
		"H",
		"J",
		"K",
		"L",
		"M",
		"N",
		"P",
		"Ph",
		"Ph",
		"Pr",
		"Q",
		"R",
		"R",
		"S",
		"T",
		"Th",
		"V",
		"W",
		"X",
		"Y",
		"Z",
	],

	'maybesecondconsonant': [
		"", "", "", "", "", "", "", "", "", "",
		"l", "r",
	],

	'vowel': [
		"a", "a",
		"e", "e",
		"ei",
		"eo",
		"eu",
		"i",
		"io",
		"o",
		"ou",
		"y",
	],

	'midletters': [
		"b", "b", "b",
		"g", "g", "g",
		"gn",
		"k", "k", "k",
		"kh",
		"kh",
		"kh",
		"kl",
		"kr",
		"l",
		"l",
		"l",
		"lk",
		"m", "m", "m",
		"mbr",
		"mn",
		"mp",
		"mph",
		"n", "n", "n",
		"nd",
		"ndr",
		"nt",
		"nth",
		"p", "p", "p", "p",
		"ph",
		"phr",
		"pp",
		"ps",
		"r", "r", "r",
		"rkh",
		"rg",
		"rm",
		"rrh",
		"rs",
		"s", "s", "s",
		"ss",
		"sp",
		"st",
		"sth",
		"t", "t", "t",
		"th", "th", "th",
		"tl",
		"tr",
		"x",
	],
	
	'ending': [
		'#endingvowels#',
		'#endingvowels##endingconsonants#',
	],

	'endingconsonants': [
		'lite',
		's', 's', 's', 's', 's', 's',
		'rs', 'rs',
		'folk',
		'morph',
		'don',
		'd',
		'f',
		'g',
		'j',
		'k', 'ke',
		'l', 'lk', 'ls',
		'm',
		'n', 'n', 'n', 'n',
		'p',
		'r', 'r', 'r', 'r',
		't', 'te',
		'v',
		'w',
		'x',
		'y',
		'z',
	],

	'endingvowels': [
		"a",
		"e",
		"i",
		"o",
		"u",
		"ao",
		"ia",
		"io",
	],

	'endingvowels-orig': [
		"a",
		"e",
		"i",
		"o",
		"aos",
		"as",
		"en",
		"es",
		"er",
		"ers",
		"ia",
		"idon",
		"ike",
		"ite",
		"ios",
		"olk",
		"ol",
		"ols",
		"on",
		"ons",
		"ul",
		"us",
		"ut",
		"ys",
	],
});

export default grammar;