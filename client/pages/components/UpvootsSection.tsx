import { IconButton } from "@chakra-ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Flex } from "@chakra-ui/layout";
import React, { useState } from "react";
import {
  PostWithCreatorFragment,
  useVoteMutation,
} from "../../src/generated/graphql";

interface UpvootsSectionProps {
  post: PostWithCreatorFragment;
}

const UpvootsSection: React.FC<UpvootsSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "upvoot-loading" | "downvoot-loading" | "not-loading"
  >("not-loading");
  const [, vote] = useVoteMutation();
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === 1) {
            console.log("You have already upvooted this post");
            
            return;
          }
          setLoadingState("upvoot-loading");
          await vote({ postId: post.id, value: 1 });
          setLoadingState("not-loading");
        }}
        isLoading={loadingState === "upvoot-loading"}
        colorScheme={post.voteStatus === 1 ? "green" : undefined}
        aria-label="Upvoot Icon"
        fontSize="24px"
        icon={<ChevronUpIcon />}
        />
      {post.points}
      <IconButton
        onClick={async () => {
          if (post.voteStatus === -1) {
            console.log("You have already downvooted this post");
            return;
          }
          setLoadingState("downvoot-loading");
          await vote({ postId: post.id, value: -1 });
          setLoadingState("not-loading");
        }}
        isLoading={loadingState === "downvoot-loading"}
        colorScheme={post.voteStatus === -1 ? "red" : undefined}
        aria-label="downvoot Icon"
        fontSize="24px"
        icon={<ChevronDownIcon />}
      />
    </Flex>
  );
};

export default UpvootsSection;
