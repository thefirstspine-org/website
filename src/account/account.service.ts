import { Injectable } from '@nestjs/common';
import * as axios from 'axios';

@Injectable()
export class AccountService {
  public async login(email: string, password: string): Promise<LoginResult> {
    return this.callApi('login', {email, password}, 'post');
  }

  public async signup(email: string, password: string): Promise<SignupResult> {
    return this.callApi('signup', {email, password, meta: {}}, 'post');
  }

  public async resetPassword(email: string): Promise<SignupResult> {
    return this.callApi('reset-password', {email}, 'post');
  }

  public async updateEmail(email: string, token: string): Promise<SignupResult> {
    return this.callApi('me/email', {email, access_token: token}, 'put');
  }

  public async updatePassword(password: string, token: string): Promise<SignupResult> {
    return this.callApi('me/password', {password, access_token: token}, 'put');
  }

  public async callApi(path: string, data: any, method: 'post' | 'put' = 'post'): Promise<any> {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (data.access_token) {
        headers['Authorization'] = `Bearer ${data.access_token}`;
      }
      const response = await axios.default[method](
        `${process.env.AUTH_URL}/api/v3/${path}`,
        data,
        {
          headers,
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
  email?: string;
  meta?: {[key: string]: string | number | boolean};
}
