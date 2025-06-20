import { Injectable } from '@nestjs/common';
import * as axios from 'axios';

@Injectable()
export class AccountService {
  public async login(email: string, password: string): Promise<LoginResult> {
    return this.callApi('login', {email, password});
  }

  public async signup(email: string, password: string): Promise<SignupResult> {
    return this.callApi('signup', {email, password, meta: {}});
  }

  public async resetPassword(email: string): Promise<SignupResult> {
    return this.callApi('reset-password', {email});
  }

  public async callApi(path: string, data: any): Promise<any> {
    try {
      const response = await axios.default.post(
        `${process.env.AUTH_URL}/api/v3/${path}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return {
        errors: typeof(error?.response?.data?.message) == 'object' && error?.response?.data?.message.length != undefined
          ? error?.response?.data?.message
          : [error?.response?.data?.message],
      }
    }
  }
}

export interface LoginResult {
  errors?: string[];
  access_token?: string;
  refresh_token?: string;
}

export interface SignupResult {
  errors?: string[];
  user_id?: number;
  meta?: {[key: string]: string | number | boolean};
}
