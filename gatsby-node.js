const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const _ = require("lodash")
const kebabCase = require("lodash.kebabcase")

//각 블로그 포스트에 대해서 페이지를 생성해준다
exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // Define a template for blog post
  const blogPost = path.resolve(`./src/templates/blog-post.js`)

  // Tag페이지를 위한 템플릿 define
  const tagTemplate = path.resolve(`./src/templates/tags.js`)

  // Get all markdown blog posts sorted by date
  // 두 개의 allMarkdownRemark 필드가 있기 때문에, 이름충돌을 방지하고자 alias를 붙임
  const result = await graphql(
    `
      {
        postsRemark: allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 2000
        ) {
          edges {
            node {
              id
              fields {
                slug
              }
              frontmatter {
                title
                tags
              }
            }
          }
        }
        tagsGroup: allMarkdownRemark(limit: 2000){
          group(field: frontmatter___tags){
            fieldValue
          }
        }
      }
    `)

  if (result.errors) {
    reporter.panicOnBuild(
      `Error while running GraphQL query.`,
      result.errors
    )
    return
  }

  const posts = result.data.postsRemark.edges

  // Create blog posts pages
  // But only if there's at least one markdown file found at "content/blog" (defined in gatsby-config.js)
  // `context` is available in the template as a prop and as a variable in GraphQL
  if (posts.length > 0) {
    posts.forEach(({ node }, index) => {
      const nextPostId = index === 0 ? null : posts[index - 1].id
      const previousPostId = index === posts.length - 1 ? null : posts[index + 1].id

      createPage({
        path: node.fields.slug,
        component: blogPost,
        context: {
          id: node.id,
          previousPostId,
          nextPostId,
        },
      })
    })

    // GraphQL 쿼리 결과에서 tag data들을 추출
    const tags = result.data.tagsGroup.group

    // Tag페이지 생성
    tags.forEach(tag => {
      createPage({
        path: `/tags/${_.kebabCase(tag.fieldValue)}/`,
        component: tagTemplate,
        context: {
          tag: tag.fieldValue,
        },
      })
    })
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })

    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  // Explicitly define the siteMetadata {} object
  // This way those will always be defined even if removed from gatsby-config.js

  // Also explicitly define the Markdown frontmatter
  // This way the "MarkdownRemark" queries will return `null` even when no
  // blog posts are stored inside "content/blog" instead of returning an error
  createTypes(`
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
      github: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
      tags: [String!]!
    }

    type Fields {
      slug: String
    }
  `)
}
