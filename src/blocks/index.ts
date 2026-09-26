import { CourseGroupsBlock } from './CourseGroupsSection'
import { EmployersBlock } from './Employers'
import { FaqBlock } from './Faq'
import { FeaturedCoursesBlock } from './FeaturedCourses'
import { GalleryBlock } from './GallerySection'
import { HeroBlock } from './Hero'
import { NewsBlock } from './NewsSection'
import { PartnersBlock } from './PartnersSection'
import { RegisterBlock } from './Register'
import { StaffBlock } from './StaffSection'
import { StatsBlock } from './Stats'
import { SuccessStoriesBlock } from './SuccessStoriesSection'
import { VideosBlock } from './Videos'
import { WhyBlock } from './Why'

/** Every section type the homepage can contain, in the order of design Option A. */
export const homepageBlocks = [
  HeroBlock,
  StatsBlock,
  CourseGroupsBlock,
  FeaturedCoursesBlock,
  WhyBlock,
  SuccessStoriesBlock,
  StaffBlock,
  VideosBlock,
  NewsBlock,
  PartnersBlock,
  EmployersBlock,
  FaqBlock,
  RegisterBlock,
  GalleryBlock,
]
