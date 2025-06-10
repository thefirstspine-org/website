import { Injectable } from '@nestjs/common';
import * as axios from 'axios';

@Injectable()
export class StrapiService {

  private readonly activateCache = true; // Enable or disable caching
  private readonly cache: Map<string, CachedRequest> = new Map();
  private readonly cacheDuration = 1000 * 60; // Cache duration in milliseconds (1 minute)

  async getGlobalData(): Promise<GlobalData | undefined> {
    // Get the page
    const data = await this.callApi(`global?populate[0]=defaultSeo&populate[1]=defaultSeo.shareImage&populate[2]=navigation`);
    return data;
  }

  async getArticles(categorySlug: string | undefined): Promise<any[]> {
    // Get the page
    if (categorySlug) {
      return this.callApi(`articles?populate=*&sort=createdAt:desc&filters[category][slug][$eq]=${categorySlug}`);
    } else {
      return this.callApi(`articles?populate=*&sort=createdAt:desc`);
    }
  }

  async getArticle(slug: string): Promise<any | null> {
    // Get the page
    const data = await this.callApi(`articles?populate=*&filters[slug][$eq]=${slug}`);
    const page = data[0];

    // Get the blocks
    const blocks = await this.callApi(
      `blocks?` +
      `populate[0]=content&` +
      `populate[1]=content.button1&` +
      `populate[2]=content.button2&` +
      `populate[3]=content.button3&` +
      `populate[4]=background&` +
      `populate[5]=image&` +
      `populate[6]=content.media&` +
      `populate[7]=content.video&` +
      `populate[8]=content.files&` +
      `filters[page][documentId][$eq]=${page.documentId}`);
    page.blocks = page.blocks.map((block: Document) => {
      return blocks.find((b: Document) => b.documentId === block.documentId) || block;
    });

    return page;
  }

  async getPageData(path: string | null): Promise<PageData | null> {
    // Get the page
    const pages = await this.callApi(`pages?populate[0]=seo&populate[1]=seo.shareImage&populate[2]=blocks&filters${( path ? `[canonicalUrl][$eq]=${path}` : '[canonicalUrl][$notNull]' )}`);
    if (pages.length === 0) {
      return null;
    }
    const page = pages[0];

    // Get the blocks
    const blocks = await this.callApi(
      `blocks?` +
      `populate[0]=content&` +
      `populate[1]=content.button1&` +
      `populate[2]=content.button2&` +
      `populate[3]=content.button3&` +
      `populate[4]=background&` +
      `populate[5]=image&` +
      `populate[6]=content.media&` +
      `populate[7]=content.video&` +
      `populate[8]=content.files&` +
      `filters[page][documentId][$eq]=${page.documentId}`);
    page.blocks = page.blocks.map((block: Document) => {
      return blocks.find((b: Document) => b.documentId === block.documentId) || block;
    });

    return page;
  }

  async callApi(path: string): Promise<any[] | any> {
    // Check cache
    if (this.activateCache && this.cache.has(path)) {
      const cached = this.cache.get(path);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
    }
    // Fetch data from API
    try {
        const response = await axios.default.get(
        `${process.env.CMS_URL}/api/${path}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CMS_TOKEN}`,
          },
        }
      );
      // Cache the response
      if (this.activateCache) {
        this.cache.set(path, {
          expires: Date.now() + this.cacheDuration,
          data: response.data.data
        });
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching data from Strapi API: ${JSON.stringify(error?.response?.data) || error.message}`);
      return null;
    }
  }

}

export interface CachedRequest {
  expires: number;
  data: any[];
}

export interface Document {
  id: number;
  documentId: string;
  title: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface SEO {
  id: number;
  metaTitle: string | null;
  metaDescription: string | null;
  shareImage: Media | null;
}

export interface PageData extends Document {
  canonicalUrl: string | null;
  blocks: Block[];
  seo: Array<SEO>;
}

export interface Block extends Document {
  image: Media | null;
  background: Media | null;
  content: Array<ComponentRichText | ComponentButton>;
}

export interface Media extends Document {
  url: string;
  alternativeText: string | null;
  caption: string | null;
  formats: {
    small: MediaFormat | null;
    medium: MediaFormat | null;
    large: MediaFormat | null;
    thumbnail: MediaFormat | null;
  }
}

export interface MediaFormat {
  url: string;
  width: number;
  height: number;
  ext: string;
  hash: string;
  mime: string;
  name: string;
  size: number;
}

export interface Component {
  __component: string;
  id: number;
}

export interface ComponentRichText extends Component {
  body: string;
}

export interface ComponentButton extends Component {
  icon: string | null;
  label: string | null;
  link: string | null;
  style: string | null;
  size: string | null;
  openInNewTab: boolean | null;
}

export interface GlobalData extends Document {
  siteName: string;
  siteDescription: string;
  defaultSeo: SEO;
}
