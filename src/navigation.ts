import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getPermalink('/'),
    },
    {
      text: 'Tools',
      links: [
        {
          text: 'Test 1',
          href: getPermalink('/homes/mobile-app'),
        },
      ],
    },
    {
      text: 'Resources',
      links: [
        {
          text: 'Features (Anchor Link)',
          href: getPermalink('/#features'),
        },
        {
          text: 'Test',
          href: getPermalink('/resources/test'),
        },
        {
          text: 'Test2',
          href: getPermalink('/resources/test2'),
        },
        {
          text: 'Test3',
          href: getPermalink('/resources/test3'),
        },
      ],
    },
    {
      text: 'Applications',
      links: [
        {
          text: 'Click-Through',
          href: getPermalink('/applications/click-through'),
        },
      ],
    },
    {
      text: 'Blog',
      links: [
        {
          text: 'Blog List',
          href: getBlogPermalink(),
        },
        {
          text: 'Article',
          href: getPermalink('get-started-website-with-astro-tailwind-css', 'post'),
        },
        {
          text: 'Article (with MDX)',
          href: getPermalink('markdown-elements-demo-post', 'post'),
        },
        {
          text: 'Category Page',
          href: getPermalink('tutorials', 'category'),
        },
        {
          text: 'Tag Page',
          href: getPermalink('astro', 'tag'),
        },
      ],
    },
    {
      text: 'About',
      links: [
        {
          text: 'Contact',
          href: getPermalink('/about/contact'),
        },
        {
          text: 'Terms',
          href: getPermalink('/about/terms'),
        },
        {
          text: 'Privacy policy',
          href: getPermalink('/about/privacy'),
        },  
      ]
    },
  ],
  actions: [
    { text: 'Downloads', href: 'https://github.com/onwidget/astrowind', target: '_blank' },
    { text: 'Contribute', href: 'https://github.com/onwidget/astrowind', target: '_blank' }
  ],
};

export const footerData = {
  links: [
    {
      title: 'Product',
      links: [
        { text: 'Features', href: '#' },
        { text: 'Security', href: '#' },
        { text: 'Team', href: '#' },
        { text: 'Enterprise', href: '#' },
        { text: 'Customer stories', href: '#' },
        { text: 'Pricing', href: '#' },
        { text: 'Resources', href: '#' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/geopetra' },
  ],
  footNote: `
    <img class="w-5 h-5 md:w-6 md:h-6 md:-mt-0.5 bg-cover mr-1.5 rtl:mr-0 rtl:ml-1.5 float-left rtl:float-right rounded-sm" src="https://onwidget.com/favicon/favicon-32x32.png" alt="onWidget logo" loading="lazy"></img>
    Made by <a class="text-blue-600 underline dark:text-muted" href="https://onwidget.com/"> onWidget</a> · All rights reserved.
  `,
};
