import os
import re

sections = [
    'sections/mission-story.liquid',
    'sections/how-it-works-steps.liquid',
    'sections/collection-steps.liquid',
    'sections/mission-proof.liquid',
    'sections/page-contact-custom.liquid',
    'sections/page-feeding-gallery.liquid',
    'sections/page-one-tee-can.liquid',
    'sections/impact-tracker.liquid',
    'sections/sticky-atc.liquid'
]

padding_schema = """
    },
    {
      "type": "header",
      "content": "t:sections.all.padding.section_padding_heading"
    },
    {
      "type": "range",
      "id": "padding_top",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "t:sections.all.padding.padding_top",
      "default": 36
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "t:sections.all.padding.padding_bottom",
      "default": 36
    }
  ]"""

padding_css = """
<style data-shopify>
  .section-{{ section.id }}-padding {
    padding-top: {{ section.settings.padding_top | times: 0.75 | round: 0 }}px;
    padding-bottom: {{ section.settings.padding_bottom | times: 0.75 | round: 0 }}px;
  }

  @media screen and (min-width: 750px) {
    .section-{{ section.id }}-padding {
      padding-top: {{ section.settings.padding_top }}px;
      padding-bottom: {{ section.settings.padding_bottom }}px;
    }
  }
</style>
"""

for s in sections:
    if not os.path.exists(s):
        continue
    with open(s, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'padding_top' in content:
        continue # already has it
    
    # Insert schema just before the end of settings
    # Usually settings: [ ... ], -> we want to replace the last } before ],
    # A robust way is to find the end of the schema json.
    # But usually it's easier to find:
    # "settings": [ ... ]
    
    match = re.search(r'(\s*\}\s*)\n\s*\]\s*(,\s*"blocks"|,\s*"presets"|\n\s*\})', content)
    if match:
        replacement = padding_schema + match.group(2)
        content = content[:match.start()] + match.group(1) + replacement + content[match.end():]
        
    # Now wrap the main container or insert the CSS.
    # Just insert the CSS block after {% endschema %}
    content = re.sub(r'(\{% endschema %\})', r'\1\n' + padding_css, content)
    
    # And add class="section-{{ section.id }}-padding" to the first div after endschema
    # Or replace <div class="something"> with <div class="something section-{{ section.id }}-padding">
    match2 = re.search(r'\{% endschema %\}.*?(<div[^>]*class="[^"]*)(")', content, re.DOTALL)
    if match2:
        # Check if it already has the class
        if 'section-{{ section.id }}-padding' not in content:
             content = content[:match2.start(2)] + ' section-{{ section.id }}-padding' + content[match2.start(2):]
    else:
        # If no div with class, maybe just `<div`
        match3 = re.search(r'\{% endschema %\}.*?(<[a-z]+)', content, re.DOTALL)
        if match3:
             content = content[:match3.end(1)] + ' class="section-{{ section.id }}-padding"' + content[match3.end(1):]
             
    with open(s, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated", s)

# fix the duplicate label in page-about-us
try:
    with open('sections/page-about-us.liquid', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('"label": "CTA Love Text",\\n      "label": "CTA Love Text",', '"label": "CTA Love Text",')
    with open('sections/page-about-us.liquid', 'w', encoding='utf-8') as f:
        f.write(content)
except:
    pass
