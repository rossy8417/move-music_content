import { createClient } from '@supabase/supabase-js';

// 環境変数の読み込みを確認
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 環境変数のチェック
console.log('環境変数チェック:', {
  SUPABASE_URL_EXISTS: !!supabaseUrl,
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY_EXISTS: !!supabaseAnonKey,
  SUPABASE_ANON_KEY_PREFIX: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'なし'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数が正しく設定されていません。.envファイルを確認してください。');
}

// より詳細なデバッグ情報を出力するオプションを追加
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => {
      // リクエストをログに出力
      console.log('Supabase API リクエスト:', args[0]);
      return fetch(...args).then(response => {
        // レスポンスのステータスをログに出力
        console.log('Supabase API レスポンス:', {
          url: args[0],
          status: response.status,
          statusText: response.statusText
        });
        return response;
      }).catch(error => {
        // エラーをログに出力
        console.error('Supabase API エラー:', {
          url: args[0],
          error: error.message
        });
        throw error;
      });
    }
  }
});

// ストレージバケットの名前（大文字小文字に注意）
export const STORAGE_BUCKET = 'contest-files';

// バケットのRLSポリシーを確認する関数
export async function checkBucketPermissions() {
  try {
    console.log('バケットのRLSポリシーを確認します...');
    
    // まずバケットが存在するか確認
    console.log('バケット一覧を取得します...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('バケット一覧の取得に失敗しました:', listError);
      
      // エラーの詳細を解析
      if (listError.message.includes('permission')) {
        console.error('権限エラー: バケット一覧を取得する権限がありません。RLSポリシーを確認してください。');
      } else if (listError.message.includes('network')) {
        console.error('ネットワークエラー: Supabaseサーバーに接続できません。インターネット接続を確認してください。');
      } else if (listError.message.includes('authentication')) {
        console.error('認証エラー: APIキーが無効か期限切れです。環境変数を確認してください。');
      }
      
      return {
        exists: false,
        canRead: false,
        canWrite: false,
        error: listError.message
      };
    }
    
    // バケット一覧が空の場合
    if (!buckets || buckets.length === 0) {
      console.warn('バケット一覧が空です。バケットが存在しないか、一覧を取得する権限がありません。');
      
      // 直接バケットにアクセスしてみる
      console.log(`直接 '${STORAGE_BUCKET}' バケットにアクセスを試みます...`);
      const { data: files, error: directError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list();
        
      if (directError) {
        console.error(`直接バケットアクセスエラー:`, directError);
        
        if (directError.message.includes('not found')) {
          console.error(`バケット '${STORAGE_BUCKET}' が存在しません。`);
        } else if (directError.message.includes('permission')) {
          console.error(`バケット '${STORAGE_BUCKET}' へのアクセス権限がありません。`);
        }
        
        return {
          exists: false,
          canRead: false,
          canWrite: false,
          error: directError.message
        };
      } else {
        console.log(`バケット '${STORAGE_BUCKET}' に直接アクセスできました。ファイル数: ${files?.length || 0}`);
        return {
          exists: true,
          canRead: true,
          canWrite: false, // 書き込み権限はまだ確認していない
          error: 'バケット一覧は取得できませんが、直接アクセスは可能です。'
        };
      }
    }
    
    // バケット名を小文字に変換して比較（大文字小文字の違いを検出）
    const bucketNames = buckets.map(b => b.name);
    console.log('利用可能なバケット一覧（大文字小文字区別）:', bucketNames);
    
    // 大文字小文字を区別せずに比較
    const bucketExistsIgnoreCase = bucketNames.some(name => 
      name.toLowerCase() === STORAGE_BUCKET.toLowerCase()
    );
    
    // 正確な名前で存在するか
    const bucketExists = bucketNames.includes(STORAGE_BUCKET);
    
    if (bucketExistsIgnoreCase && !bucketExists) {
      console.warn(`バケットは存在しますが、名前の大文字小文字が異なります。
      コード上: '${STORAGE_BUCKET}'
      実際のバケット: '${bucketNames.find(name => name.toLowerCase() === STORAGE_BUCKET.toLowerCase())}'`);
    }
    
    // バケットが存在しない場合
    if (!bucketExists) {
      return {
        exists: false,
        canRead: false,
        canWrite: false,
        error: bucketExistsIgnoreCase ? 'バケット名の大文字小文字が一致しません' : 'バケットが存在しません'
      };
    }
    
    // 読み取り権限の確認
    console.log(`バケット '${STORAGE_BUCKET}' の読み取り権限を確認します...`);
    const testReadResult = await supabase.storage
      .from(STORAGE_BUCKET)
      .list();
      
    const canRead = !testReadResult.error;
    
    if (!canRead) {
      console.error('読み取り権限エラー:', testReadResult.error);
    } else {
      console.log('読み取り権限あり。ファイル数:', testReadResult.data?.length || 0);
    }
    
    // 書き込み権限の確認（空のファイルをアップロードして確認）
    console.log(`バケット '${STORAGE_BUCKET}' の書き込み権限を確認します...`);
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFileName = '_permission_test_' + Date.now();
    const testWriteResult = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(testFileName, testFile, { upsert: true });
      
    const canWrite = !testWriteResult.error;
    
    if (!canWrite) {
      console.error('書き込み権限エラー:', testWriteResult.error);
    } else {
      console.log('書き込み権限あり。テストファイル作成成功:', testWriteResult.data?.path);
    }
    
    // テストファイルを削除（書き込み成功した場合のみ）
    if (canWrite && testWriteResult.data) {
      console.log('テストファイルを削除します...');
      const { error: removeError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([testWriteResult.data.path]);
        
      if (removeError) {
        console.error('テストファイル削除エラー:', removeError);
      } else {
        console.log('テストファイル削除成功');
      }
    }
    
    return {
      exists: true,
      canRead,
      canWrite,
      error: canRead && canWrite ? null : 
        (testReadResult.error?.message || testWriteResult.error?.message)
    };
  } catch (error) {
    console.error('バケット権限の確認中にエラーが発生しました:', error);
    return {
      exists: false,
      canRead: false,
      canWrite: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
}

// 直接バケットを作成する関数
export async function createStorageBucket() {
  try {
    console.log('バケット作成を試みます...');
    const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
    });
    
    if (error) {
      console.error('バケット作成エラー:', error);
      return false;
    }
    
    console.log('バケット作成成功:', data);
    return true;
  } catch (error) {
    console.error('バケット作成中の例外:', error);
    return false;
  }
}

// ストレージバケットを確認する関数
export async function initializeStorage() {
  try {
    console.log('Supabase接続情報:', { 
      url: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'なし',
    });

    // Supabase接続テスト
    console.log('Supabase接続テスト中...');
    const { data: connectionTest, error: connectionError } = await supabase.from('posts').select('count()', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('Supabase接続エラー:', connectionError);
      
      if (connectionError.message.includes('not found')) {
        console.error('テーブルが見つかりません。データベースが正しく設定されているか確認してください。');
      } else if (connectionError.message.includes('permission')) {
        console.error('テーブルへのアクセス権限がありません。RLSポリシーを確認してください。');
      } else if (connectionError.message.includes('network')) {
        console.error('ネットワークエラー: Supabaseサーバーに接続できません。インターネット接続を確認してください。');
      } else if (connectionError.message.includes('authentication')) {
        console.error('認証エラー: APIキーが無効か期限切れです。環境変数を確認してください。');
      }
    } else {
      console.log('Supabase接続成功:', connectionTest);
    }

    // バケット一覧を取得して詳細をログに出力
    console.log('ストレージバケット一覧を取得中...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('バケット一覧の取得に失敗しました:', listError);
      
      // エラーの詳細を確認
      if (listError.message.includes('permission')) {
        console.error('権限エラー: バケット一覧を取得する権限がありません。RLSポリシーを確認してください。');
        console.error('Supabaseダッシュボードで以下を確認してください:');
        console.error('1. Storage > Policies で匿名ユーザー(anon)に対するバケット一覧表示の権限が付与されているか');
        console.error('2. SQL Editorで以下のSQLを実行して権限を付与することもできます:');
        console.error(`
          -- バケット一覧表示の権限を付与
          CREATE POLICY "Allow public bucket listing" ON storage.buckets
            FOR SELECT TO anon USING (true);
        `);
      }
      
      // 直接バケットにアクセスしてみる
      console.log(`直接 '${STORAGE_BUCKET}' バケットにアクセスを試みます...`);
      const { data: files, error: directError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list();
        
      if (directError) {
        console.error(`直接バケットアクセスエラー:`, directError);
        
        if (directError.message.includes('not found')) {
          console.error(`バケット '${STORAGE_BUCKET}' が存在しません。Supabaseダッシュボードで作成してください。`);
        } else if (directError.message.includes('permission')) {
          console.error(`バケット '${STORAGE_BUCKET}' へのアクセス権限がありません。RLSポリシーを確認してください。`);
          console.error('Supabaseダッシュボードで以下を確認してください:');
          console.error(`1. Storage > ${STORAGE_BUCKET} > Policies で匿名ユーザー(anon)に対する読み取り権限が付与されているか`);
          console.error('2. SQL Editorで以下のSQLを実行して権限を付与することもできます:');
          console.error(`
            -- バケット内のファイル一覧表示の権限を付与
            CREATE POLICY "Allow public file listing" ON storage.objects
              FOR SELECT TO anon USING (bucket_id = '${STORAGE_BUCKET}');
          `);
        }
      } else {
        console.log(`バケット '${STORAGE_BUCKET}' に直接アクセスできました。ファイル数: ${files?.length || 0}`);
      }
      
      return;
    }
    
    console.log('利用可能なバケット一覧:', buckets?.map(b => b.name));
    
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    // バケットが存在しない場合は作成を試みる
    if (!bucketExists) {
      console.warn(`ストレージバケット '${STORAGE_BUCKET}' が存在しません。作成を試みます...`);
      
      const created = await createStorageBucket();
      
      if (!created) {
        console.warn(`バケットの自動作成に失敗しました。手動で作成してください。`);
        console.warn(`手順: 
        1. Supabaseダッシュボード(${supabaseUrl})にアクセス
        2. 「Storage」メニューを選択
        3. 「New Bucket」ボタンをクリック
        4. バケット名に「${STORAGE_BUCKET}」を入力
        5. 「Public」オプションを有効にする
        6. 「Create bucket」ボタンをクリック`);
        
        console.warn('または、SQL Editorで以下のSQLを実行してバケットを作成することもできます:');
        console.warn(`
          -- バケットを作成
          INSERT INTO storage.buckets (id, name, public)
          VALUES ('${STORAGE_BUCKET}', '${STORAGE_BUCKET}', true);
          
          -- 読み取り権限を付与
          CREATE POLICY "Allow public read" ON storage.objects
            FOR SELECT TO anon USING (bucket_id = '${STORAGE_BUCKET}');
            
          -- 書き込み権限を付与
          CREATE POLICY "Allow public insert" ON storage.objects
            FOR INSERT TO anon WITH CHECK (bucket_id = '${STORAGE_BUCKET}');
        `);
      } else {
        console.log(`バケット '${STORAGE_BUCKET}' を作成しました。`);
      }
    } else {
      console.log(`ストレージバケット '${STORAGE_BUCKET}' は存在します`);
      
      // バケット内のフォルダ構造を確認
      try {
        const { data: folders, error: foldersError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list();
          
        if (foldersError) {
          console.error('バケット内のフォルダ一覧取得に失敗:', foldersError);
          
          if (foldersError.message.includes('permission')) {
            console.error(`バケット '${STORAGE_BUCKET}' へのアクセス権限がありません。RLSポリシーを確認してください。`);
            console.error('Supabaseダッシュボードで以下を確認してください:');
            console.error(`1. Storage > ${STORAGE_BUCKET} > Policies で匿名ユーザー(anon)に対する読み取り権限が付与されているか`);
          }
        } else {
          console.log('バケット内のフォルダ/ファイル一覧:', folders);
          
          // uploadsフォルダが存在するか確認
          const uploadsExists = folders?.some(item => item.name === 'uploads');
          
          if (!uploadsExists) {
            console.log('uploadsフォルダが存在しないため、空のファイルをアップロードして作成します');
            
            // 空のファイルを作成してuploadsフォルダを作成
            const emptyFile = new Blob([''], { type: 'text/plain' });
            const { error: uploadError } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload('uploads/.folder', emptyFile);
              
            if (uploadError) {
              console.error('uploadsフォルダの作成に失敗:', uploadError);
              
              if (uploadError.message.includes('permission')) {
                console.error(`バケット '${STORAGE_BUCKET}' への書き込み権限がありません。RLSポリシーを確認してください。`);
                console.error('Supabaseダッシュボードで以下を確認してください:');
                console.error(`1. Storage > ${STORAGE_BUCKET} > Policies で匿名ユーザー(anon)に対する書き込み権限が付与されているか`);
              }
            } else {
              console.log('uploadsフォルダを作成しました');
            }
          }
        }
      } catch (folderError) {
        console.error('フォルダ構造の確認中にエラー:', folderError);
      }
    }
    
    // 権限チェックを実行
    console.log('バケットの権限チェックを実行します...');
    const permissions = await checkBucketPermissions();
    console.log('バケット権限チェック結果:', permissions);
    
    if (!permissions.canRead || !permissions.canWrite) {
      console.error('バケットの権限が不足しています。Supabaseダッシュボードで権限を確認してください。');
      
      if (!permissions.canRead) {
        console.error(`バケット '${STORAGE_BUCKET}' への読み取り権限がありません。`);
      }
      
      if (!permissions.canWrite) {
        console.error(`バケット '${STORAGE_BUCKET}' への書き込み権限がありません。`);
      }
      
      console.error('Supabaseダッシュボードで以下を確認してください:');
      console.error(`1. Storage > ${STORAGE_BUCKET} > Policies で匿名ユーザー(anon)に対する権限が付与されているか`);
      console.error('2. SQL Editorで以下のSQLを実行して権限を付与することもできます:');
      console.error(`
        -- 読み取り権限を付与
        CREATE POLICY "Allow public read" ON storage.objects
          FOR SELECT TO anon USING (bucket_id = '${STORAGE_BUCKET}');
          
        -- 書き込み権限を付与
        CREATE POLICY "Allow public insert" ON storage.objects
          FOR INSERT TO anon WITH CHECK (bucket_id = '${STORAGE_BUCKET}');
      `);
    } else {
      console.log(`バケット '${STORAGE_BUCKET}' への読み取り・書き込み権限があります。`);
    }
  } catch (error) {
    console.error('ストレージの初期化中にエラーが発生しました:', error);
  }
}