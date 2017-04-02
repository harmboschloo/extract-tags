import tagger from 'extract-tags';
import _tag from '../../../output/test/fixtures/multiple-tagger-modules/given_tag.txt';
import _tag2 from '../../../output/test/fixtures/multiple-tagger-modules/given_tag2.txt';
import taggerA from 'extract-tags/a';
import taggerB from 'extract-tags/b';

tagger`
  tagged
`;

taggerB(_tag);

taggerA(_tag2);
