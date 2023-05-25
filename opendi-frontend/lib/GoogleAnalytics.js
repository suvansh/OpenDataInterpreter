export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID

// log the pageview with their URL
export const pageview = (url) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}

// log specific events happening.
export const event = ({ action, params }) => {
  window.gtag('event', action, params)
}
