import { Helmet } from "react-helmet-async";

export const JsonLd = ({ data }: { data: any }) => {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
};
