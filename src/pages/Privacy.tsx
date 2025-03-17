import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} className="mr-1" /> 戻る
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">プライバシーポリシー</h1>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. はじめに</h2>
          <p className="mb-2">
            本プライバシーポリシーは、Move Music Content（以下「当サービス」）が収集する情報と、
            その情報の使用方法について説明します。
          </p>
          <p>
            当サービスを利用することにより、本プライバシーポリシーに記載された情報の収集と使用に同意したものとみなされます。
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. 収集する情報</h2>
          <p className="mb-2">当サービスでは、以下の情報を収集する場合があります：</p>
          <ul className="list-disc pl-6 mb-2">
            <li>Facebookアカウントから提供される情報（名前、プロフィール画像、メールアドレスなど）</li>
            <li>投稿内容、コメント、いいねなどのユーザーが生成したコンテンツ</li>
            <li>アップロードされたファイル（画像、音声、動画など）</li>
            <li>利用状況に関する情報（アクセス日時、利用機能など）</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. 情報の使用目的</h2>
          <p className="mb-2">収集した情報は、以下の目的で使用されます：</p>
          <ul className="list-disc pl-6 mb-2">
            <li>サービスの提供と維持</li>
            <li>ユーザー認証と本人確認</li>
            <li>ユーザー体験の向上</li>
            <li>コンテンツの表示とパーソナライズ</li>
            <li>サービスの改善と新機能の開発</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. 情報の共有</h2>
          <p className="mb-2">
            当サービスは、以下の場合を除き、ユーザーの個人情報を第三者と共有することはありません：
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>ユーザーの同意がある場合</li>
            <li>法的要請に応じる必要がある場合</li>
            <li>サービス提供に必要なパートナー企業（データ保存サービスなど）との共有</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. データの保護</h2>
          <p>
            当サービスは、ユーザーの個人情報を保護するために適切なセキュリティ対策を講じていますが、
            インターネット上での完全なセキュリティを保証することはできません。
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. ユーザーの権利</h2>
          <p className="mb-2">ユーザーには以下の権利があります：</p>
          <ul className="list-disc pl-6 mb-2">
            <li>個人情報へのアクセス</li>
            <li>個人情報の訂正</li>
            <li>個人情報の削除（「データ削除」ページから申請可能）</li>
            <li>個人情報の処理の制限</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">7. Cookieの使用</h2>
          <p>
            当サービスでは、ユーザー体験の向上やサービスの改善のためにCookieを使用することがあります。
            ブラウザの設定によりCookieの使用を制限することができますが、
            一部の機能が正常に動作しなくなる可能性があります。
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">8. 第三者サービス</h2>
          <p>
            当サービスは、Facebook認証などの第三者サービスを利用しています。
            これらのサービスには独自のプライバシーポリシーがあり、
            当サービスはこれらの第三者サービスのプライバシー慣行については責任を負いません。
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">9. プライバシーポリシーの変更</h2>
          <p>
            当サービスは、必要に応じて本プライバシーポリシーを更新することがあります。
            変更があった場合は、このページで通知します。
            定期的に本ページを確認することをお勧めします。
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">10. お問い合わせ</h2>
          <p>
            本プライバシーポリシーに関するご質問やご意見がある場合は、
            <a href="mailto:contact@ht-sw.tech" className="text-blue-600 hover:underline">contact@ht-sw.tech</a>
            までお問い合わせください。
          </p>
        </section>
        
        <div className="mt-8 text-sm text-gray-500">
          最終更新日: 2024年3月17日
        </div>
      </div>
    </div>
  );
} 