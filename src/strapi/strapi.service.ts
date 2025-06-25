import { Injectable } from '@nestjs/common';
import * as axios from 'axios';
import locales from '../locale/locales';

@Injectable()
export class StrapiService {

  private readonly cache: {[key: string]: CachedRequest} = {}
  private readonly cacheDuration = 1000 * 60; // Cache duration in milliseconds (1 minute)

  async getGlobalData(): Promise<GlobalData | undefined> {
    // Get the page
    const data = await this.callApiGet(`global?populate[0]=defaultSeo&populate[1]=defaultSeo.shareImage&populate[2]=navigation`, locales.getLocale());
    return data;
  }

  async getArticles(categorySlug: string | undefined): Promise<any[]> {
    // Get the page
    if (categorySlug) {
      return this.callApiGet(`articles?populate=*&sort=createdAt:desc&filters[category][slug][$eq]=${categorySlug}`, locales.getLocale());
    } else {
      return this.callApiGet(`articles?populate=*&sort=createdAt:desc`, locales.getLocale());
    }
  }

  async getCodes(userId: string): Promise<any | null> {
    const data = await this.callApiGet(`codes?populate=*&filters[userId][$eq]=${userId}`);
    return data;
  }

  async getUnusedCode(code: string): Promise<any | null> {
    const data = await this.callApiGet(`codes?populate=*&filters[code][$eq]=${code}&filters[userId][$eq]=0`, '', true);
    return data && data[0] ? data[0] : null;
  }

  async redeemCode(documentId: string, userId: number): Promise<any | null> {
    const data = await this.callApiPut('codes', documentId, { userId });
    return data && data[0] ? data[0] : null;
  }

  async getArticle(slug: string): Promise<any | null> {
    // Get the page
    const data = await this.callApiGet(`articles?populate=*&filters[slug][$eq]=${slug}`, locales.getLocale());
    if (data.length === 0) {
      return null;
    }
    const page = data[0];

    // Get the blocks
    const blocks = await this.callApiGet(
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
      `filters[page][documentId][$eq]=${page.documentId}`,
      locales.getLocale()
    );
    page.blocks = page.blocks.map((block: Document) => {
      return blocks.find((b: Document) => b.documentId === block.documentId) || block;
    });

    return page;
  }

  async getPageData(path: string | null): Promise<PageData | null> {
    // Get the page
    const pages = await this.callApiGet(
      `pages?populate[0]=seo&populate[1]=seo.shareImage&populate[2]=blocks&filters${( path ? `[canonicalUrl][$eq]=${path}` : '[canonicalUrl][$notNull]' )}`,
      locales.getLocale()
    );
    if (pages.length === 0) {
      return null;
    }
    const page = pages[0];

    // Get the blocks
    const blocks = await this.callApiGet(
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
      `filters[page][documentId][$eq]=${page.documentId}`,
      locales.getLocale()
    );
    page.blocks = page.blocks.map((block: Document) => {
      return blocks.find((b: Document) => b.documentId === block.documentId) || block;
    });

    return page;
  }

  async getEmail(email: string, campaign: string): Promise<any[]> {
    // Get the page
    return this.callApiGet(`emails?filters[email][$eq]=${email}&filters[campaign][$eq]=${campaign}`, undefined, true);
  }

  async createEmail(email: string, campaign: string): Promise<any> {
    this.callApiPost(
      'emails',
      {
        email,
        campaign
      }
    );
  }

  async callApiGet(path: string, locale: string = 'en', deactivateCache = false): Promise<any[] | any> {
    // Check cache
    const cacheKey = `path:${path},locale:${locale}`;
    if (!deactivateCache && this.cache[cacheKey] != undefined) {
      const cached = this.cache[cacheKey];
      if (cached && cached.expires > Date.now()) {
        return JSON.parse(JSON.stringify(cached.data)); // deep clone response
      }
    }
    // Fetch data from API
    try {
        const response = await axios.default.get(
        `${process.env.CMS_URL}/api/${path}&locale=${locale}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CMS_TOKEN}`,
          },
        }
      );
      // Cache the response
      if (!deactivateCache) {
        this.cache[cacheKey] = {
          expires: Date.now() + this.cacheDuration,
          data: response.data.data
        };
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching data from Strapi API: ${JSON.stringify(error?.response?.data) || error.message}`);
      return null;
    }
  }

  async callApiPost(entity: string, data: any): Promise<any[] | any> {
    // Fetch data from API
    try {
        const response = await axios.default.post(
        `${process.env.CMS_URL}/api/${entity}`,
        { data },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CMS_TOKEN}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching data from Strapi API: ${JSON.stringify(error?.response?.data) || error.message}`);
      return null;
    }
  }

  async callApiPut(entity: string, entityId: string, data: any): Promise<any[] | any> {
    // Fetch data from API
    try {
        const response = await axios.default.put(
        `${process.env.CMS_URL}/api/${entity}/${entityId}`,
        { data },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CMS_TOKEN}`,
          },
        }
      );
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
