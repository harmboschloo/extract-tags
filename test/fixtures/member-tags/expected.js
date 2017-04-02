import _tag from '../../../output/test/fixtures/member-tags/given_tag.1.txt';
import _tag2 from '../../../output/test/fixtures/member-tags/given_tag2.2.txt';
import tagger from 'extract-tags';

tagger`
  tagged
`;

tagger.prop1(_tag);

tagger.prop2(_tag2);

tagger.other`
  tagged other
`;
