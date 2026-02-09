import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base:
				process.env.NODE_ENV === 'development'
					? ''
					: process.env.BASE_PATH ?? '/zh-bible-verse-memorizer'
		}
	}
};

export default config;
