// Centralized stickers list for the app (image-based)
export type Sticker = {
	id: string;
	src: string;
	alt: string;
};

export const stickers: Sticker[] = [
	{ id: 'smile', src: '/stickers/smile.svg', alt: 'Smile' },
	{ id: 'laugh', src: '/stickers/laugh.svg', alt: 'Laugh' },
	{ id: 'love', src: '/stickers/love.svg', alt: 'Love' },
	{ id: 'cool', src: '/stickers/cool.svg', alt: 'Cool' },
	{ id: 'cry', src: '/stickers/cry.svg', alt: 'Cry' },
	{ id: 'angry', src: '/stickers/angry.svg', alt: 'Angry' },
	{ id: 'thumbs', src: '/stickers/thumbs.svg', alt: 'Thumbs up' },
	{ id: 'cat', src: '/stickers/cat.svg', alt: 'Cat' },
	{ id: 'star', src: '/stickers/star.svg', alt: 'Star' },
	{ id: 'party', src: '/stickers/party.svg', alt: 'Party' },
	{ id: 'rickroll', src: '/stickers/rickroll.svg', alt: 'Rickroll' },
	{ id: 'tralalero', src: '/stickers/tralalero.svg', alt: 'Tralalero' },
];

export default stickers;
