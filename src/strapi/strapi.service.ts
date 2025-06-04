import { Injectable } from '@nestjs/common';
import * as axios from 'axios';

@Injectable()
export class StrapiService {

  private readonly activateCache = true; // Enable or disable caching
  private readonly cache: Map<string, CachedRequest> = new Map();
  private readonly cacheDuration = 1000 * 60; // Cache duration in milliseconds (1 minute)

  async getGlobalData(): Promise<GlobalData | null> {
    // Get the page
    const data = await this.callApi(`global?populate=*`);
    return data;
  }

  async getPageData(path: string | null): Promise<PageData | null> {
    // Get the page
    const pages = await this.callApi(`pages?populate=*&filters${( path ? `[canonicalUrl][$eq]=${path}` : '[canonicalUrl][$notNull]' )}`);
    if (pages.length === 0) {
      return null;
    }
    const page = pages[0];

    // Get the blocks
    const blocks = await this.callApi(`blocks?populate=*&filters[page][documentId][$eq]=${page.documentId}`);
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
}

export interface PageData extends Document {
  canonicalUrl: string | null;
  blocks: Block[];
  seo: SEO | null;
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
