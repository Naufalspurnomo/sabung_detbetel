"use client";

import { useState } from "react";

const BOOKMARKLET_CODE = `javascript:void(function(){
  var h=document.documentElement.outerHTML;
  var u=location.href;
  var w=window.open('','_blank','width=600,height=400');
  w.document.write('<html><body style="font-family:sans-serif;padding:20px"><h3>Mengirim ke DetBetel...</h3><p id="s">Memproses...</p></body></html>');
  fetch('https://detbetel.netlify.app/api/fb-post',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({url:u,cookies:'',html:h})
  }).then(r=>r.json()).then(d=>{
    if(d.ok){
      w.document.getElementById('s').innerHTML='<b style="color:green">✓ Berhasil!</b> '+d.post.author+' — '+d.post.text.substring(0,100)+'...';
      w.document.getElementById('s').innerHTML+='<br><br><a href="https://detbetel.netlify.app/tools/ibr-analyzer" target="_top">Buka IBR Analyzer →</a>';
    } else {
      w.document.getElementById('s').innerHTML='<b style="color:red">✗ Error:</b> '+(d.error||'Unknown');
    }
  }).catch(e=>{
    w.document.getElementById('s').innerHTML='<b style="color:red">✗ Gagal:</b> '+e.message;
  });
}())`;

export default function BookmarkletHelper() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        border: "1px solid #333",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#e2e8f0" }}>
        🔖 Bookmarklet (1x setup, selamanya bisa pakai link)
      </h3>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 13,
          color: "#94a3b8",
          lineHeight: 1.5,
        }}
      >
        Cara paling gampang — sekali setup, tinggal klik di postingan FB manapun:
      </p>
      <ol
        style={{
          margin: "0 0 12px 20px",
          fontSize: 13,
          color: "#cbd5e1",
          lineHeight: 1.8,
        }}
      >
        <li>
          <strong>Drag</strong> tombol di bawah ke bookmark bar browser lo
        </li>
        <li>Buka postingan FB yang mau dianalisis</li>
        <li>
          Klik bookmark <strong>"Kirim ke DetBetel"</strong> di bookmark bar
        </li>
        <li>HTML langsung terkirim — tinggal cek hasilnya di app</li>
      </ol>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Draggable bookmarklet button */}
        <a
          href={BOOKMARKLET_CODE}
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            cursor: "grab",
            userSelect: "none",
            boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
          }}
          onClick={(e) => e.preventDefault()}
          title="Drag ini ke bookmark bar lo!"
        >
          📌 Kirim ke DetBetel
        </a>

        <span style={{ fontSize: 12, color: "#64748b" }}>← drag ke ↑ bookmark bar</span>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={copyCode}
          style={{
            background: copied ? "#16a34a" : "#334155",
            color: "#e2e8f0",
            border: "1px solid #475569",
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy Code"}
        </button>
        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>
          Atau copy code, buka bookmark bar → Add page → paste di URL
        </span>
      </div>

      <details style={{ marginTop: 12 }}>
        <summary
          style={{
            fontSize: 12,
            color: "#64748b",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          Advanced: API endpoint manual
        </summary>
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: "#0f172a",
            borderRadius: 6,
            fontSize: 11,
            fontFamily: "monospace",
            color: "#94a3b8",
            wordBreak: "break-all",
          }}
        >
          POST https://detbetel.netlify.app/api/fb-post
          <br />
          {`{ "url": "...", "cookies": "", "html": "<page HTML>" }`}
        </div>
      </details>
    </div>
  );
}
