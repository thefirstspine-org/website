import { Injectable } from '@nestjs/common';
import * as axios from 'axios';

@Injectable()
export class AppService {

  async getPageData(path: string | null): Promise<PageData | null> {
    // Get the page
    const pages = await this.callApi(`pages?populate=*&filters${( path ? `[canonicalUrl][$eq]=${path}` : '[canonicalUrl][$notNull]' )}`);
    if (pages.length === 0) {
      return null;
    }
    const page = pages[0];

    // Get the blocks
    const blocks = await this.callApi(`blocks?populate=*&filters[page][documentId][$eq]=${page.documentId}`);
    page.blocks = blocks;

    return page;
  }

  async callApi(path: string): Promise<any[]> {
    const response = await axios.default.get(
      `https://dev.cms.thefirstspine.fr/api/${path}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 24b1f7fdcfda1db33ee2e10b16f1d4280425ada71a28ece51c85e1888852a3d654102c8837972ebfca72588addecd2f482072980aff5eeff1f648b4874b0b6e4e7c6ed65cdf3db603d37e9b78f49fa44de3327be30a9f63e12f49cec37567c78357b7978591125a8f7d376933960c23d6dd2f10efcae4d79b51034c645387c2e`,
        },
      }
    );
    console.log({path, response: response.data});
    return response.data.data;
  }

}

export interface Document {
  id: number;
  documentId: string;
  title: string;
  locale: string;
}

export interface PageData extends Document {
  canonicalUrl: string | null;
  blocks: Block[];
}

export interface Block extends Document {
  image: string | null;
  background: string | null;
  content: Array<ComponentRichText | ComponentButton>;
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
