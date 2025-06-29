declare module '../components/ScreenTemplate' {
  import { FC } from 'react';
  interface Props {
    children?: React.ReactNode;
  }
  const ScreenTemplate: FC<Props>;
  export default ScreenTemplate;
}