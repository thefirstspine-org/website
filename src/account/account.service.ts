import { Injectable } from '@nestjs/common';
import * as axios from 'axios';

@Injectable()
export class AccountService {
  public async login(email: string, password: string): Promise<LoginResult> {
    try {
      const response = await axios.default.post(
        `${process.env.AUTH_URL}/api/v3/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(response.data);
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
}
