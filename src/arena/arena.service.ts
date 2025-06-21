import { Injectable } from '@nestjs/common';
import * as axios from 'axios';

@Injectable()
export class ArenaService {
  public async getCurrentPlayer(token: string): Promise<any> {
    return this.callApi('get-current-player', token);
  }

  public async callApi(path: string, token: string, params: any = {}): Promise<any> {
    try {
      const request = await axios.default.post(
        `${process.env.ARENA_URL}/${path}`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!request.data.status) {
        return null;
      }
      return request.data.data;
    } catch (error) {
      return null;
    }
  }
}
