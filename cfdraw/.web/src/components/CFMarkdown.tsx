import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight as codeStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import { observer } from "mobx-react-lite";
import { Box, BoxProps } from "@chakra-ui/react";

SyntaxHighlighter.registerLanguage("json", json);

interface ICFMarkdown extends BoxProps {
  markdown: string;
}
function CFMarkdown({ markdown, ...props }: ICFMarkdown) {
  return (
    <Box w="100%" h="100%" userSelect="text" {...props}>
      <ReactMarkdown
        children={markdown}
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                children={String(children).replace(/\n$/, "")}
                style={codeStyle}
                language={match[1]}
                PreTag="div"
              />
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            );
          },
        }}
      />
    </Box>
  );
}

export default observer(CFMarkdown);
