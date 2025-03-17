interface FacebookLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    expiresIn: string;
    signedRequest: string;
    userID: string;
  };
}

interface FacebookUserData {
  id: string;
  name?: string;
  email?: string;
  picture?: {
    data: {
      url: string;
      width: number;
      height: number;
      is_silhouette: boolean;
    };
  };
}

interface FacebookSDK {
  init(options: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }): void;
  getLoginStatus(callback: (response: FacebookLoginStatusResponse) => void): void;
  login(
    callback: (response: FacebookLoginStatusResponse) => void,
    options?: { scope: string }
  ): void;
  logout(callback: (response: any) => void): void;
  api(
    path: string,
    params: { fields: string },
    callback: (response: FacebookUserData) => void
  ): void;
}

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: FacebookSDK;
  }
}

export {}; 