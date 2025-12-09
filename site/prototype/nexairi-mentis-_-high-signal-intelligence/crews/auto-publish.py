if __name__ == "__main__":
    import sys, subprocess, os
    from pathlib import Path
    
    topic = sys.argv[1]
    category = sys.argv[2]
    
    # Run crew → get JSON
    result = run_newsroom(topic, category)
    
    # Parse JSON
    article = json.loads(result)
    slug = article["slug"]
    timestamp = int(time.time() * 1000)
    filename = f"{slug}-{timestamp}.json"
    
    # Auto-save to drafts
    draft_path = DRAFTS_DIR / filename
    draft_path.write_text(json.dumps(article, indent=2))
    print(f"✅ Wrote {draft_path}")
    
    # Auto-ingest
    subprocess.run(["npm", "run", "ingest:article", "--", str(draft_path)], 
                   cwd=ROOT_DIR, check=True)
    print("✅ Ingested!")
    
    # Auto-commit + push
    subprocess.run(["git", "add", "."], cwd=ROOT_DIR, check=True)
    subprocess.run(["git", "commit", "-m", f"feat: AI newsroom - {topic}"], cwd=ROOT_DIR, check=True)
    subprocess.run(["git", "push"], cwd=ROOT_DIR, check=True)
    print("✅ Deployed to Cloudflare!")
    
    print(f"🚀 {topic} is LIVE on Nexairi!")
