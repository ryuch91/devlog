from notion.client import NotionClient
from slugify import slugify
import datetime
import os
import re
import requests
import time
import hashlib
import shutil
import sys

# Basic Settings
NOTION_TOKEN = os.getenv('NOTION_TOKEN')
NOTION_ROOT_PAGE_ID = os.getenv('NOTION_ROOT_PAGE_ID')

if NOTION_TOKEN is None:
    sys.exit("The Notion Token is missing!")
if NOTION_ROOT_PAGE_ID is None:
    sys.exit("The Notion root page id is missing!")
client = NotionClient(token_v2=NOTION_TOKEN)
root_page_id = NOTION_ROOT_PAGE_ID

dest_path = os.path.normpath(os.path.join(
    os.path.dirname(__file__), '..', 'content', 'blog'))
markdown_pages = {}
regex_meta = re.compile(r'^== *(\w+) *:* (.+) *$')
ignore_root = True

# 특정 파일을 받아서 저장하고, 그 이름을 반환해주는 함수
def download_file(file_url, destination_folder):
    r = requests.get(file_url, stream=True)
    # converts response headers mime type to an extension (may not work with everything)
    ext = r.headers['content-type'].split('/')[-1]

    tmp_file_name = f'tmp.{ext}'
    tmp_file_path = os.path.join(destination_folder, tmp_file_name)

    print(f"-> Downloading {file_url}")

    h = hashlib.sha1()
    # open the file to write as binary - replace 'wb' with 'w' for text files
    with open(tmp_file_path, 'wb') as f:
        # iterate on stream using 1KB packets
        for chunk in r.iter_content(1024):
            f.write(chunk)  # write the file
            h.update(chunk)

    final_file_name = f'{h.hexdigest()}.{ext}'
    final_file_path = os.path.join(destination_folder, final_file_name)

    os.rename(tmp_file_path, final_file_path)

    return final_file_name


def process_block(block, text_prefix=''):
    was_bulleted_list = False
    text = ''
    metas = []

    for content in block.children:
        # Close the bulleted list.
        if was_bulleted_list and content.type != 'bulleted_list':
            text = text + '\n'
            was_bulleted_list = False

        if content.type == 'header':
            text = text + f'# {content.title}\n\n'
        elif content.type == 'sub_header':
            text = text + f'## {content.title}\n\n'
        elif content.type == 'sub_sub_header':
            text = text + f'### {content.title}\n\n'
        elif content.type == 'code':
            text = text + f'```{content.language}\n{content.title}\n```\n\n'
        elif content.type == 'image':
            image_name = download_file(content.source, dest_path)
            text = text + text_prefix + f'![{image_name}]({image_name})\n\n'
        elif content.type == 'bulleted_list':
            text = text + text_prefix + f'* {content.title}\n'
            was_bulleted_list = True
        elif content.type == 'divider':
            text = text + f'---\n'
        elif content.type == 'text':
            matchMeta = regex_meta.match(content.title)
            if matchMeta:
                key = matchMeta.group(1)
                value = matchMeta.group(2)
                metas.append(f"{key}: '{value}'")
            else:
                text = text + text_prefix + f'{content.title}\n\n'
        elif content.type == 'video':
            text = text + f'`video: {content.source}`\n\n'
        elif content.type == 'page':
            subpage_slug = to_markdown(content.id)
            text = text + f'[{content.title}](/blog/{subpage_slug})\n\n'
        else:
            print("Unsupported type: " + content.type)

        if len(content.children) and content.type != 'page':
            child_text, child_metas = process_block(content, '  ')
            text = text + child_text
            metas = metas + child_metas

    return text, metas

def collection_to_markdown(collection_id, ignore):
    contents_collection = client.get_collection(collection_id)
    posts = contents_collection.get_rows()
    #properties = contents_collection.get_schema_properties()
    for post in posts:
        print(f'post -> markdown : {post}')
        to_markdown(post)

def to_markdown(page):
    #page = client.get_block(page_id)
    page_title = page.title
    slug = slugify(page_title)
    text = ''
    metas = []

    # Handle Frontmatter
    metas.append(f"title: '{page_title}'")

    # Download the cover and add it to the frontmatter.
    raw_page = page.get()
    if 'format' in raw_page and 'page_cover' in raw_page['format']:
        page_cover_url = raw_page['format']['page_cover']
        cover_image_name = download_file(page_cover_url, dest_path)
        metas.append(f"featured: '{cover_image_name}'")

    text, child_metas = process_block(page)

    metas = metas + child_metas
    metaText = '---\n' + '\n'.join(metas) + '\n---\n'
    text = metaText + text

    # Save the page data if it is not the root page.
    markdown_pages[slug] = text

    return slug



if __name__=="__main__":
    print(f' -> Cleaning the "{dest_path}" folder')
    try:
        shutil.rmtree(dest_path)
    except:
        pass
    os.mkdir(dest_path)

    collection_to_markdown(root_page_id, ignore=ignore_root)
    #to_markdown(root_page_id, ignore=ignore_root)

    for slug, markdown in markdown_pages.items():
        file_name = slug + '.md'
        file_path = os.path.join(dest_path, file_name)
        new_file = open(file_path, 'w')
        new_file.write(markdown)
        print('-> Imported "' + file_name + '"')
    print('Done: imported ' + str(len(markdown_pages)) + ' pages.')
