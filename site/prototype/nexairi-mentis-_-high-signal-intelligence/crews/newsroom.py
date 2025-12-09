    date_str = now.strftime("%Y-%m-%d")
    # basic slug base from topic
    slug_base = (
        topic.lower()
        .replace("—", "-")
        .replace("–", "-")
        .replace(" ", "-")
        .replace(":", "")
        .replace("?", "")
        .replace("!", "")
        .replace(",", "")
    )
    slug_base = "-".join(filter(None, slug_base.split("-")))  # no empty segments

    # placeholder slug; editor may refine slug text, but content path pattern stays
    category_lower = category.lower()
    content_path = f"{CONTENT_BASE}/{category_lower}/{slug_base}.html"

    return {
        "id": f"{slug_base}-{int(time.time() * 1000)}",
        "topic": topic,
        "category": category,
        "subCategory": "",  # can be filled by prompt or inputs if needed
        "slugBase": slug_base,
        "date": date_str,
        "contentPath": content_path,
    }


def build_newsroom_crew(topic: str, category: str, sub_category: str = "") -> Crew:
    runtime_context = build_runtime_context(topic, category)
    research_task, writer_task, editor_task, layout_task, publisher_task = create_tasks(
        topic, category, sub_category or runtime_context.get("subCategory", ""), runtime_context
    )

    crew = Crew(
        agents=[researcher_agent, writer_agent, editor_agent, layout_agent, publisher_agent],
        tasks=[research_task, writer_task, editor_task, layout_task, publisher_task],
        process=Process.sequential,
        verbose=True,
    )

    # Attach runtime context into crew inputs; publisher will see it in prompts
    crew_inputs = {
        "topic": topic,
        "category": category,
        "subCategory": sub_category,
        "runtimeContext": runtime_context,
    }

    # Slight hack: store on crew for later reference in kickoff wrapper
    crew._nexairi_inputs = crew_inputs
    return crew


def run_newsroom(topic: str, category: str, sub_category: str = ""):
    crew = build_newsroom_crew(topic, category, sub_category)
    inputs = getattr(crew, "_nexairi_inputs", {"topic": topic, "category": category, "subCategory": sub_category})
    result = crew.kickoff(inputs=inputs)
    return result


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python crews/newsroom.py \"Topic Here\" Category [SubCategory]")
        sys.exit(1)

    topic_arg = sys.argv[1]
    category_arg = sys.argv[2]
    sub_category_arg = sys.argv[3] if len(sys.argv) > 3 else ""

    final_result = run_newsroom(topic_arg, category_arg, sub_category_arg)
    print("\n=== Nexairi Newsroom Result ===")
    print(final_result)
