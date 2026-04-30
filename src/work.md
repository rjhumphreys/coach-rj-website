---
layout: layouts/page.njk
title: Work
eyebrow: Projects &amp; writing
subtitle: Graduate research, case studies, and training write-ups.
permalink: /work/
---

<div class="work-grid">
  {%- for item in collections.work -%}
    {%- set isFeatured = item.data.featured -%}
    <a class="work-card{% if isFeatured %} featured{% endif %}" href="{{ item.url }}">
      <div class="work-card-image">
        {% if item.data.image %}<img src="{{ item.data.image }}" alt="{{ item.data.title }}">{% endif %}
      </div>
      <div class="work-card-body">
        {% if item.data.tag %}<div class="work-card-meta">{{ item.data.tag }}</div>{% endif %}
        <h3>{{ item.data.title }}</h3>
        <p>{{ item.data.summary }}</p>
      </div>
    </a>
  {%- endfor -%}
</div>
