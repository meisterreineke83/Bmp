package de.libero91.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Libero '91 – das Spiel selbst ist eine HTML-Seite in assets/index.html.
 * Diese Activity zeigt sie bildschirmfüllend an; der Spielstand liegt im localStorage der WebView.
 */
public class MainActivity extends Activity {

    private WebView web;

    /** Zurück-Taste: im Spiel zum Hauptmenü, während eines Spiels ignorieren, im Menü die App schließen. */
    private static final String BACK_JS =
        "(function(){" +
        " var m=document.querySelector('#scr-menu'), st=document.querySelector('#scr-start'), ma=document.querySelector('#scr-match');" +
        " if((m&&!m.hidden)||(st&&!st.hidden)) return 'exit';" +
        " if(ma&&!ma.hidden&&typeof M!=='undefined'&&M&&!M.done) return 'stay';" +
        " show('menu'); return 'stay';" +
        "})()";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.parseColor("#0a0c24"));
        getWindow().setNavigationBarColor(Color.parseColor("#0a0c24"));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0a0c24"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        web.setWebViewClient(new WebViewClient());
        setContentView(web);

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript(BACK_JS, result -> {
            if (result != null && result.contains("exit")) finish();
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }
}
